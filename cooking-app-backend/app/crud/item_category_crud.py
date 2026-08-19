from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item_category import ItemCategory
from app.schemas.item_category import ItemCategoryBase, ItemCategoryData


class ItemCategoryCRUD:
    async def create(
        self, db: AsyncSession, data: ItemCategoryData
    ) -> ItemCategoryBase:
        item_category = ItemCategory(**data.model_dump())
        db.add(item_category)

        await db.flush()
        await db.refresh(item_category)
        return item_category

    async def select_search(
        self,
        db: AsyncSession,
        name: str | None = None,
    ) -> list[ItemCategoryBase]:
        query = select(ItemCategory).where(ItemCategory.state > 0)

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(ItemCategory.name.ilike(pattern))

        # Order
        query = query.order_by(ItemCategory.name)

        # Execute
        result = await db.execute(query)
        items = result.scalars().all()

        return items

    async def get_ingredient_category(self, db: AsyncSession) -> ItemCategoryBase:
        query = select(ItemCategory).where(
            ItemCategory.code == "INGREDIENT",
            ItemCategory.state > 0,
        )

        # Execute
        result = await db.execute(query)
        return result.scalar_one_or_none()


item_category_crud_instance = ItemCategoryCRUD()
