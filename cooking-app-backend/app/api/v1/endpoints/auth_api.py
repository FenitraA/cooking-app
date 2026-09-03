from datetime import timedelta, timezone, datetime
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.decorators import handle_endpoint_errors
from app.crud.app_user_crud import app_user_crud_instance
from app.models.refresh_token import RefreshToken
from app.schemas.app_user import AppUserLogin
from app.core.security import (
    clear_auth_cookies,
    create_refresh_token,
    get_current_user,
    set_auth_cookies,
    verify_password,
    create_access_token,
)
from app.db.database import get_db
from jose import JWTError

from app.core.config import settings

from app.crud.refresh_token_crud import refresh_token_crud_instance
from app.schemas.exceptions import (
    RefreshTokenInvalid,
    RefreshTokenNotFound,
    RefreshTokenRevoked,
)
from app.core.security import limiter

router = APIRouter(tags=["Auth"])


@router.post("/login")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def login(
    request: Request,
    data: AppUserLogin,
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    user = await app_user_crud_instance.get_user_by_username(
        db,
        data.username,
    )

    if not user or not verify_password(data.password, user.password):
        return JSONResponse(
            {"detail": "Invalid credentials"},
            status_code=401,
        )

    roles = await app_user_crud_instance.list_user_roles(db, user.id)

    access_token = create_access_token(
        {
            "sub": user.id,
            "roles": roles,
            "default_language": user.default_language,
            "ref_household_id": user.ref_household_id,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        now=now,
    )

    refresh_token = create_refresh_token()

    await refresh_token_crud_instance.create(
        db,
        token_hash=RefreshToken.hash_refresh(refresh_token),
        user_id=user.id,
        created_at=now,
        expire_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    await db.commit()

    response = JSONResponse(
        {
            "message": "Login successful",
            "default_language": user.default_language,
            "roles": roles,
            "ref_household_id": user.ref_household_id,
        }
    )

    set_auth_cookies(
        response,
        access_token,
        refresh_token,
    )

    return response


@router.post("/refresh")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        return JSONResponse(
            {"detail": "Refresh token missing"},
            status_code=401,
        )
    try:
        token, user = await refresh_token_crud_instance.get_valid_token(
            db,
            RefreshToken.hash_refresh(refresh_token_value),
        )
        roles = await app_user_crud_instance.list_user_roles(
            db,
            user.id,
        )
        new_token, new_token_value = token.get_heir_token()
        token.revoke_token()
        db.add(new_token)
        access_token = create_access_token(
            {
                "sub": user.id,
                "roles": roles,
                "default_language": user.default_language,
                "ref_household_id": user.ref_household_id,
            },
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        await db.commit()
        response = JSONResponse({"message": "Token refreshed"})
        set_auth_cookies(
            response,
            access_token,
            new_token_value,
        )
        return response

    except RefreshTokenRevoked:
        # replay attack detected
        token, user = await refresh_token_crud_instance.get_by_hash_including_revoked(
            db,
            RefreshToken.hash_refresh(refresh_token_value),
        )
        await refresh_token_crud_instance.revoke_all_for_user(
            db,
            user.id,
        )
        await db.commit()
        response = JSONResponse(
            {"detail": "Refresh token reuse detected. All sessions revoked."},
            status_code=401,
        )
        clear_auth_cookies(response)
        return response

    except (RefreshTokenInvalid, RefreshTokenNotFound):
        await db.rollback()
        response = JSONResponse(
            {"detail": "Invalid refresh token"},
            status_code=401,
        )
        clear_auth_cookies(response)
        return response
    except Exception:
        await db.rollback()
        raise


@router.post("/logout")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    response = JSONResponse(
        {"message": "Logged out"}
    )

    clear_auth_cookies(response)
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        return response
    try:
        await refresh_token_crud_instance.revoke_one(
            db,
            RefreshToken.hash_refresh(refresh_token_value),
        )

        await db.commit()
    except (
        RefreshTokenNotFound,
        RefreshTokenInvalid,
        RefreshTokenRevoked,
    ):
        await db.rollback()
    return response

@router.post("/logout-all")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def logout_all(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await refresh_token_crud_instance.revoke_all_for_user(
        db,
        current_user["id"],
    )
    await db.commit()
    response = JSONResponse(
        {"message": "Logged out from all devices"}
    )
    clear_auth_cookies(response)
    return response

@router.get("/me")
@limiter.limit("50/minute")
@handle_endpoint_errors()
async def me(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    full_user = await app_user_crud_instance.get_user_by_id(db, id=current_user["id"])
    return {"id": full_user.id, "username": full_user.username}


@router.get("/health")
async def health():
    return {"status": "ok"}
