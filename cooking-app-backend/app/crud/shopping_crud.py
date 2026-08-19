from collections import defaultdict
from datetime import date, datetime, timezone

from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shopping import Shopping
from app.models.shopping_item import ShoppingItem
from app.schemas.shopping import (
    ShoppingBase,
    ShoppingCreate,
    ShoppingCreateFromItemsToBuy,
    ShoppingCreateResponse,
    ShoppingRead,
    ShoppingSearchResult,
)

from app.crud.item_to_buy_crud import item_to_buy_crud_instance
from app.crud.shopping_item_crud import shopping_item_crud_instance
from app.schemas.shopping_item import ShoppingItemBase, ShoppingItemData
from app.services.shopping_service import get_total_estimated_price_from_items


class ShoppingCRUD:
    async def create(
        self, db: AsyncSession, data: ShoppingCreate
    ) -> ShoppingCreateResponse:
        shopping = Shopping(**data.model_dump(exclude={"shopping_items"}))
        db.add(shopping)
        await db.flush()
        await db.refresh(shopping)

        # Add shopping items
        new_shopping_items: list[ShoppingItemBase] = (
            await shopping_item_crud_instance.bulk_create(
                db, data.shopping_items, shopping.id
            )
        )

        return ShoppingCreateResponse(
            shopping=shopping, shopping_items=new_shopping_items
        )

    async def create_from_items_to_buy(
        self,
        db: AsyncSession,
        data: ShoppingCreateFromItemsToBuy,
    ) -> ShoppingCreateResponse:
        shopping = Shopping(**data.model_dump(exclude={"item_to_buy_ids"}))

        db.add(shopping)

        await db.flush()
        await db.refresh(shopping)

        items_to_buy = await item_to_buy_crud_instance.get_by_ids(
            db,
            data.item_to_buy_ids,
        )

        shopping_items_data = [
            ShoppingItemData(
                name=item.name,
                description=item.description,
                unit_price=item.estimated_unit_price,
                units_bought=item.units_to_buy,
                ref_ingredient_id=item.ref_ingredient_id,
                ref_shopping_id=shopping.id,
                ref_item_category_id=item.ref_item_category_id,
            )
            for item in items_to_buy
        ]

        new_shopping_items = await shopping_item_crud_instance.bulk_create(
            db,
            shopping_items_data,
            shopping.id,
        )
        
        await item_to_buy_crud_instance.change_state_to_bought(db,items_to_buy,new_shopping_items)

        return ShoppingCreateResponse(
            shopping=shopping,
            shopping_items=new_shopping_items,
        )

    async def soft_delete(
        self, db: AsyncSession, household_id: str, shopping_id: str
    ) -> ShoppingBase:

        now = datetime.now(timezone.utc)

        shopping = await db.scalar(
            select(Shopping).where(
                Shopping.ref_household_id == household_id,
                Shopping.id == shopping_id,
                Shopping.state > 0,
            )
        )
        if not shopping:
            return None

        await db.execute(
            update(ShoppingItem)
            .where(
                ShoppingItem.ref_shopping_id == shopping.id,
                ShoppingItem.state > 0,
            )
            .values(
                state=0,
                updated_at=now,
            )
        )
        shopping.state = -1
        shopping.updated_at = now
        await db.flush()
        return shopping

    async def search_with_pagination(
        self,
        db: AsyncSession,
        household_id: str,
        start_date: date | None = None,
        end_date: date | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> ShoppingSearchResult:
        query = select(
            Shopping,
        ).where(Shopping.state > 0)
        count_query = select(func.count(Shopping.id)).where(Shopping.state > 0)

        # Filters

        query = query.where(Shopping.ref_household_id == household_id)
        count_query = count_query.where(Shopping.ref_household_id == household_id)

        if start_date:
            query = query.where(Shopping.shopping_date >= start_date)
            count_query = count_query.where(Shopping.shopping_date >= start_date)

        if end_date:
            query = query.where(Shopping.shopping_date <= end_date)
            count_query = count_query.where(Shopping.shopping_date <= end_date)

        # Order
        query = query.order_by(desc(Shopping.shopping_date))

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        total = await db.scalar(count_query)

        # Get Recipe ingredients
        shopping_ids = [row[0].id for row in rows]
        shopping_items_batch = (
            await shopping_item_crud_instance.get_shopping_items_batch(db, shopping_ids)
        )

        # group them in dict
        items_by_shopping = defaultdict(list)
        for shopping_item in shopping_items_batch:

            items_by_shopping[shopping_item.shopping_item.ref_shopping_id].append(
                shopping_item
            )

        items = [
            ShoppingRead(
                shopping=row[0],
                shopping_items=items_by_shopping[row[0].id],
                total_cost=get_total_estimated_price_from_items(
                    items_by_shopping[row[0].id]
                ),
            )
            for row in rows
        ]

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }


shopping_crud_instance = ShoppingCRUD()
