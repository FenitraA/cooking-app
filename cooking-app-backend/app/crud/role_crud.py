from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.schemas.role import RoleCreate

class RoleCRUD:
    async def create(self, db: AsyncSession, data: RoleCreate) -> Role:
        new_role = Role(**data.model_dump())
        db.add(new_role)
        await db.flush()
        await db.refresh(new_role)
        return new_role

role_crud_instance = RoleCRUD()
