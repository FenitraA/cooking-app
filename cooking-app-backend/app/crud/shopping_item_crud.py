from datetime import date, datetime, timezone

from sqlalchemy import func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient
from app.models.item_category import ItemCategory
from app.models.shopping import Shopping
from app.models.shopping_item import ShoppingItem
from app.schemas.shopping_item import (
    ShoppingItemBase,
    ShoppingItemData,
    ShoppingItemRead,
    ShoppingItemSearchResult,
)


class ShoppingItemCRUD:
    async def create(
        self, db: AsyncSession, data: ShoppingItemData
    ) -> ShoppingItemBase:
        shopping_item = ShoppingItem(**data.model_dump(exclude={"shopping_items"}))
        db.add(shopping_item)

        await db.flush()
        await db.refresh(shopping_item)
        return shopping_item

    async def bulk_create(
        self,
        db: AsyncSession,
        data: list[ShoppingItemData],
        shopping_id: str,
    ) -> list[ShoppingItemBase]:
        result = await db.execute(
            insert(ShoppingItem).returning(ShoppingItem),
            [
                {
                    **item.model_dump(exclude={"shopping_items", "ref_shopping_id"}),
                    "ref_shopping_id": shopping_id,
                }
                for item in data
            ],
        )

        return result.scalars().all()

    async def soft_delete(
        self, db: AsyncSession, shopping_item_id: str
    ) -> ShoppingItemBase:
        shopping_item = await db.scalar(
            select(ShoppingItem).where(
                ShoppingItem.id == shopping_item_id, ShoppingItem.state > 0
            )
        )
        if not shopping_item:
            return None

        shopping_item.state = -1
        shopping_item.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return shopping_item

    async def get_shopping_items_batch(
        self, db: AsyncSession, shopping_ids: list[str]
    ) -> list[ShoppingItemRead]:
        result = await db.execute(
            select(ShoppingItem, ItemCategory, Ingredient, Shopping.shopping_date)
            .join(Shopping, Shopping.id == ShoppingItem.ref_shopping_id)
            .join(ItemCategory, ItemCategory.id == ShoppingItem.ref_item_category_id)
            .outerjoin(Ingredient, Ingredient.id == ShoppingItem.ref_ingredient_id)
            .where(
                ShoppingItem.ref_shopping_id.in_(shopping_ids),
                ShoppingItem.state > 0,
            )
        )
        rows = result.all()
        return [
            ShoppingItemRead(
                shopping_item=row[0],
                item_category=row[1],
                ingredient_infos=row[2],
                shopping_date=row[3],
            )
            for row in rows
        ]

    async def search_with_pagination(
        self,
        db: AsyncSession,
        name: str | None = None,
        ingredient_id: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> ShoppingItemSearchResult:

        query = (
            select(ShoppingItem, ItemCategory, Ingredient, Shopping.shopping_date)
            .join(Shopping, Shopping.id == ShoppingItem.ref_shopping_id)
            .join(ItemCategory, ItemCategory.id == ShoppingItem.ref_item_category_id)
            .outerjoin(Ingredient, Ingredient.id == ShoppingItem.ref_ingredient_id)
            .where(ShoppingItem.state > 0)
        )
        count_query = (
            select(func.count(ShoppingItem.id))
            .join(Shopping, Shopping.id == ShoppingItem.ref_shopping_id)
            .join(ItemCategory, ItemCategory.id == ShoppingItem.ref_item_category_id)
            .outerjoin(Ingredient, Ingredient.id == ShoppingItem.ref_ingredient_id)
            .where(ShoppingItem.state > 0, ShoppingItem.state < 10)
        )

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(ShoppingItem.name.ilike(pattern))
            count_query = count_query.where(ShoppingItem.name.ilike(pattern))

        if ingredient_id:
            query = query.where(ShoppingItem.ref_ingredient_id == ingredient_id)
            count_query = count_query.where(
                ShoppingItem.ref_ingredient_id == ingredient_id
            )
        if start_date:
            query = query.where(ShoppingItem.shopping_date >= start_date)
            count_query = count_query.where(ShoppingItem.shopping_date >= start_date)

        if end_date:
            query = query.where(Shopping.shopping_date <= end_date)
            count_query = count_query.where(Shopping.shopping_date <= end_date)
            
        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        total = await db.scalar(count_query)

        items = [
            ShoppingItemRead(
                shopping_item=row[0],
                item_category=row[1],
                ingredient_infos=row[2],
                shopping_date=row[3],
            )
            for row in rows
        ]

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }


shopping_item_crud_instance = ShoppingItemCRUD()
