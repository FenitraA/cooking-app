from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.decorators import handle_endpoint_errors
from app.core.security import get_current_user, require_roles, limiter
from app.crud.role_crud import role_crud_instance
from app.schemas.app_user import (
    AppUserData,
    AppUserPasswordChange,
    AppUserPasswordReset,
    AppUserUsernameChange,
    AppUserRead,
)
from app.db.database import get_db
from app.crud.app_user_crud import app_user_crud_instance
from fastapi import status

from app.core.config import settings

from app.schemas.role import RoleCreate, RoleBase

router = APIRouter(tags=["User"])


@router.post("", response_model=AppUserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def register(
    request : Request,
    user_in: AppUserData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION))
):
    user = await app_user_crud_instance.create(db, user_in)
    await db.commit()
    return {"id": user.id, "username": user.username}


@router.put(
    "/change-password", response_model=AppUserRead, status_code=status.HTTP_201_CREATED
)
@limiter.limit("1/hour")
@handle_endpoint_errors()
async def change_password(
    request : Request,
    user_in: AppUserPasswordChange,
    db: AsyncSession = Depends(get_db),
):
    """Register a new password for a user"""
    user = await app_user_crud_instance.change_password_with_verification(
        db,
        user_id=user_in.id,
        old_password=user_in.old_password,
        new_password=user_in.new_password,
    )
    await db.commit()
    return {"id": user.id, "username": user.username}

@router.put(
    "/password-reset", response_model=AppUserRead, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/hour")
@handle_endpoint_errors()
async def password_reset(
    request : Request,
    user_in: AppUserPasswordReset,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION))
):
    """Register a new password for a user"""
    user = await app_user_crud_instance.change_password_with_verification(
        db,
        user_id=user_in.id,
        old_password=user_in.old_password,
        new_password=user_in.new_password,
    )
    await db.commit()
    return {"id": user.id, "username": user.username}


@router.put(
    "/change-username", response_model=AppUserRead, status_code=status.HTTP_201_CREATED
)
@limiter.limit("1/hour")
@handle_endpoint_errors()
async def change_username(
    request : Request,
    user_in: AppUserUsernameChange,
    db: AsyncSession = Depends(get_db),
):
    """Register a new password for a user"""
    user = await app_user_crud_instance.change_username(
        db, user_id=user_in.id, new_username=user_in.new_username
    )
    await db.commit()
    return {"id": user.id, "username": user.username}


@router.post("/roles", response_model=RoleBase, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def register_roles(
    request : Request,
    role_in: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION))
):
    new_role = await role_crud_instance.create(db, data=role_in)
    await db.commit()
    return new_role


@router.get(
    "/user-roles", response_model=list[str], status_code=status.HTTP_201_CREATED
)
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def get_user_roles(
    request : Request,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION))
):
    return await app_user_crud_instance.list_user_roles(db, user_id)
     
