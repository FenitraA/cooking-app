from datetime import timedelta, timezone, datetime
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.decorators import handle_endpoint_errors
from app.crud.app_user_crud import app_user_crud_instance
from app.models.refresh_token import RefreshToken
from app.schemas.app_user import AppUserLogin
from app.core.security import (
    create_refresh_token,
    get_current_user,
    verify_password,
    create_access_token,
)
from app.db.database import get_db
from jose import JWTError

from app.core.config import settings

from app.crud.refresh_token_crud import refresh_token_crud_instance
from app.schemas.exceptions import RefreshTokenInvalid, RefreshTokenNotFound
from app.core.security import limiter

router = APIRouter(tags=["Auth"])


@router.post("/login")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def login(
    request: Request, data: AppUserLogin, db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # access_expire_delta = timedelta(seconds=1)
    access_expire_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_expire_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    user = await app_user_crud_instance.get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.password):
        return JSONResponse({"detail": "Invalid credentials"}, status_code=401)
    # create JWT

    roles = await app_user_crud_instance.list_user_roles(db, user.id)

    access_token = create_access_token(
        {
            "sub": user.id,
            "roles": roles,
            "default_language": user.default_language,
            "ref_household_id": user.ref_household_id,
        },
        expires_delta=access_expire_delta,
        now=now,
    )
    refresh_token = create_refresh_token()

    await refresh_token_crud_instance.create(
        db,
        token_hash=RefreshToken.hash_refresh(refresh_token),
        user_id=user.id,
        created_at=now,
        expire_at=now + refresh_expire_delta,
    )

    isSecure = False
    if settings.ENVIRONMENT in ["online_dev", "online_prod"]:
        isSecure = True

    #  return token in HTTP-only cookie
    response = JSONResponse(
        {
            "message": "Login successful",
            "default_language": user.default_language,
            "roles": roles,
            "ref_household_id": user.ref_household_id,
        }
    )
    response.set_cookie(
        key="access_token",
        path="/",
        value=access_token,
        httponly=True,  # cannot be accessed by JS
        secure=isSecure,  # True in production (HTTPS)
        samesite="None" if isSecure else "lax",
        max_age=60 * settings.ACCESS_TOKEN_EXPIRE_MINUTES,  # 15 minutes
    )
    response.set_cookie(
        key="refresh_token",
        path="/",
        value=refresh_token,
        httponly=True,
        secure=isSecure,
        samesite="None" if isSecure else "lax",
        max_age=24 * 3600 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )

    await db.commit()

    return response


@router.post("/refresh")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        print("Refresh token missing")
        return JSONResponse({"detail": "Refresh token missing"}, status_code=401)

    try:
        refresh_token_obj, user = await refresh_token_crud_instance.get_valid_token(
            db, RefreshToken.hash_refresh(refresh_token)
        )
        roles = await app_user_crud_instance.list_user_roles(db, user.id)

        new_refresh_token, new_refresh_token_value = refresh_token_obj.get_heir_token()
        refresh_token_obj.revoke_token()
        db.add(new_refresh_token)
        await db.flush()
        await db.refresh(new_refresh_token)

        # issue a new access token
        new_access_token = create_access_token(
            {
                "sub": user.id,
                "roles": roles,
                "default_language": user.default_language,
                "ref_household_id": user.ref_household_id,
            },
            timedelta(minutes=15),
        )
        response = JSONResponse({"message": "Token refreshed"})

        isSecure = False
        if settings.ENVIRONMENT in ["online_dev", "online_prod"]:
            isSecure = True

        response.set_cookie(
            key="access_token",
            path="/",
            value=new_access_token,
            httponly=True,  # cannot be accessed by JS
            secure=isSecure,  # True in production (HTTPS)
            samesite="None" if isSecure else "lax",
            max_age=60 * settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )
        response.set_cookie(
            key="refresh_token",
            path="/",
            value=new_refresh_token_value,
            httponly=True,
            secure=isSecure,
            samesite="None" if isSecure else "lax",
            max_age=24 * 3600 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
        )
        await db.commit()

        return response

    except RefreshTokenNotFound as ex:
        return JSONResponse({"detail": str(ex)}, status_code=401)
    except RefreshTokenInvalid as ex:
        return JSONResponse({"detail": str(ex)}, status_code=401)
    except JWTError:
        return JSONResponse(
            {"detail": "Invalid or expired refresh token"}, status_code=401
        )


@router.post("/logout")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def logout(
    request: Request,
):
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
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