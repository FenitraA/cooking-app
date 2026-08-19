from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.household import Household
from app.schemas.household import HouseholdBase, HouseholdData


class HouseholdCRUD:
    async def create(self, db: AsyncSession, data: HouseholdData) -> HouseholdBase:
        new_household = Household(**data.model_dump())
        db.add(new_household)

        await db.flush()
        await db.refresh(new_household)
        return new_household

    async def select_search(
        self,
        db: AsyncSession,
        name: str | None = None,
    ) -> list[HouseholdBase]:
        query = select(Household).where(Household.state > 0)

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(Household.name.ilike(pattern))

        # Order
        query = query.order_by(Household.name)

        # Execute
        result = await db.execute(query)
        items = result.scalars().all()

        return items


household_crud_instance = HouseholdCRUD()
