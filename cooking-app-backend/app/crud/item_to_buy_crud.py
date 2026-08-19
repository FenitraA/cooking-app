from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient
from app.models.item_category import ItemCategory
from app.models.item_to_buy import ItemToBuy
from app.models.shopping_item import ShoppingItem
from app.schemas.item_to_buy import (
    ChangeStateToBoughtData,
    ItemToBuyBase,
    ItemToBuyData,
    ItemToBuyRead,
    ItemToBuySearchResult,
    ItemToBuyUpdateData,
)
from app.schemas.shopping_item import ShoppingItemBase


class ItemToBuyCRUD:
    async def create(self, db: AsyncSession, data: ItemToBuyData) -> ItemToBuyBase:
        item_to_buy = ItemToBuy(**data.model_dump())
        db.add(item_to_buy)

        await db.flush()
        await db.refresh(item_to_buy)
        return item_to_buy

    async def get_one(
        self, db: AsyncSession, item_to_buy_id: str
    ) -> ItemToBuyRead | None:

        result = await db.execute(
            select(ItemToBuy, ItemCategory, Ingredient)
            .join(ItemCategory, ItemCategory.id == ItemToBuy.ref_item_category_id)
            .outerjoin(Ingredient, Ingredient.id == ItemToBuy.ref_ingredient_id)
            .where(ItemToBuy.id == item_to_buy_id, ItemToBuy.state > 0, ItemToBuy.state < 10)
        )

        row = result.one_or_none()
        if row is None:
            return None

        return ItemToBuyRead(
            item_to_buy=row[0],
            item_category=row[1],
            ingredient_infos=row[2],
        )

    async def soft_delete(
        self, db: AsyncSession, household_id: str, item_to_buy_id: str
    ) -> ItemToBuyBase:
        item_to_buy = await db.scalar(
            select(ItemToBuy).where(
                ItemToBuy.ref_household_id == household_id,
                ItemToBuy.id == item_to_buy_id,
                ItemToBuy.state > 0,
            )
        )
        if not item_to_buy:
            return None

        item_to_buy.state = -1
        item_to_buy.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return item_to_buy

    async def mark_as_bought(
        self,
        db: AsyncSession,
        updates: list[ChangeStateToBoughtData],
    ) -> None:
        now = datetime.now(timezone.utc)

        await db.execute(
            update(ItemToBuy),
            [
                {
                    "id": item.item_to_buy_id,
                    "ref_shopping_item_id": item.shopping_item_id,
                    "updated_at": now,
                }
                for item in updates
            ],
        )

        await db.flush()

    async def get_by_ids(
        self,
        db: AsyncSession,
        ids: list[str],
    ) -> list[ItemToBuyBase]:
        result = await db.execute(select(ItemToBuy).where(ItemToBuy.id.in_(ids)))

        return result.scalars().all()

    async def change_state_to_bought(
        self,
        db: AsyncSession,
        items_to_buy: list[ItemToBuyBase],
        shopping_items: list[ShoppingItemBase],
    ) -> None:
        now = datetime.now(timezone.utc)

        await db.execute(
            update(ItemToBuy),
            [
                {
                    "id": item_to_buy.id,
                    "ref_shopping_item_id": shopping_item.id,
                    "state": 10,
                    "updated_at": now,
                }
                for item_to_buy, shopping_item in zip(
                    items_to_buy,
                    shopping_items,
                    strict=True,
                )
            ],
        )

    async def update(
        self, db: AsyncSession, data: ItemToBuyUpdateData
    ) -> ItemToBuyRead | None:
        """
        Update item to buy core fields
        """
        item = await db.scalar(
            select(ItemToBuy).where(ItemToBuy.id == data.id, ItemToBuy.state > 0)
        )
        if not item:
            return None

        # Update item to buy fields (exclude id)
        payload = data.model_dump(exclude_unset=True, exclude_none=True, exclude={"id"})
        for key, value in payload.items():
            setattr(item, key, value)

        item.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(item)

        return await item_to_buy_crud_instance.get_one(db, item.id)

    async def search_with_pagination(
        self,
        db: AsyncSession,
        household_id: str,
        name: str | None = None,
        ingredient_id: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> ItemToBuySearchResult:

        query = (
            select(ItemToBuy, ItemCategory, Ingredient)
            .join(ItemCategory, ItemCategory.id == ItemToBuy.ref_item_category_id)
            .outerjoin(Ingredient, Ingredient.id == ItemToBuy.ref_ingredient_id)
            .where(ItemToBuy.state > 0, ItemToBuy.state < 10)
        )
        count_query = (
            select(func.count(ItemToBuy.id))
            .join(ItemCategory, ItemCategory.id == ItemToBuy.ref_item_category_id)
            .outerjoin(Ingredient, Ingredient.id == ItemToBuy.ref_ingredient_id)
            .where(ItemToBuy.state > 0, ItemToBuy.state < 10)
        )

        # Filters
        query = query.where(ItemToBuy.ref_household_id == household_id)
        count_query = count_query.where(ItemToBuy.ref_household_id == household_id)
        if name:
            pattern = f"%{name}%"
            query = query.where(ItemToBuy.name.ilike(pattern))
            count_query = count_query.where(ItemToBuy.name.ilike(pattern))

        if ingredient_id:
            query = query.where(ItemToBuy.ref_ingredient_id == ingredient_id)
            count_query = count_query.where(
                ItemToBuy.ref_ingredient_id == ingredient_id
            )

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        total = await db.scalar(count_query)

        items = [
            ItemToBuyRead(
                item_to_buy=row[0],
                item_category=row[1],
                ingredient_infos=row[2],
            )
            for row in rows
        ]

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }


item_to_buy_crud_instance = ItemToBuyCRUD()
