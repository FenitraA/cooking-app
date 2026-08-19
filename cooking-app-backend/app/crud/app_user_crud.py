from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import aliased
from app.core.security import hash_password, verify_password
from app.models.app_user import AppUser
from app.models.role import Role
from app.models.user_role import UserRole
from app.schemas.app_user import AppUserData


class AppUserCRUD:
    async def create(self, db: AsyncSession, data: AppUserData) -> AppUser:
        # Hash the password
        data.password = hash_password(data.password)

        # Insert data
        new_app_user = AppUser(**data.model_dump())
        db.add(new_app_user)
        await db.flush()
        await db.refresh(new_app_user)
        return new_app_user

    async def get_user_by_username(
        self, db: AsyncSession, username: str
    ) -> AppUser | None:
        stmt = select(AppUser).where(AppUser.username == username, AppUser.state > 0)
        result = await db.scalars(stmt)
        return result.one_or_none()

    async def get_user_by_id(self, db: AsyncSession, id: str) -> AppUser | None:
        stmt = select(AppUser).where(AppUser.id == id, AppUser.state > 0)
        result = await db.scalars(stmt)
        return result.one_or_none()

    async def list_user_roles(self, db: AsyncSession, user_id: str):

        # Base query: user's direct roles
        base = (
            select(
                Role.id,
                Role.role_name,
                Role.ref_parent_role_id,
            )
            .join(UserRole, UserRole.ref_role_id == Role.id)
            .where(
                UserRole.ref_user_id == user_id,
                UserRole.state > 0,
                Role.state > 0,
            )
        )

        role_tree = base.cte(name="role_tree", recursive=True)

        parent_role = aliased(Role)

        # Recursive part: fetch parents
        role_tree = role_tree.union_all(
            select(
                parent_role.id,
                parent_role.role_name,
                parent_role.ref_parent_role_id,
            ).where(
                parent_role.id == role_tree.c.ref_parent_role_id,
                parent_role.state > 0,
            )
        )

        stmt = select(
            role_tree.c.role_name,
        )

        result = await db.execute(stmt)

        rows = result.scalars().all()

        return rows

    async def change_password_with_verification(
        self,
        db: AsyncSession,
        user_id: str,
        old_password: str,
        new_password: str,
    ) -> AppUser | None:
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return None

        if not verify_password(old_password, user.password):
            raise ValueError("Old password is incorrect")

        user.password = hash_password(new_password)

        await db.flush()
        await db.refresh(user)
        return user

    async def change_username(
        self, db: AsyncSession, user_id: str, new_username: str
    ) -> AppUser | None:
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return None

        # ensure username isn't already used by another active user
        existing = await self.get_user_by_username(db, new_username)
        if existing and existing.id != user_id:
            raise ValueError("Username already taken")

        user.username = new_username

        await db.flush()
        await db.refresh(user)
        return user


app_user_crud_instance = AppUserCRUD()
