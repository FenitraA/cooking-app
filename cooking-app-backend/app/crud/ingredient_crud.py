from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient
from app.crud.ingredient_stock_crud import ingredient_stock_left_subquery
from app.models.ingredient_stock import IngredientStock
from app.models.ingredient_type import IngredientType
from app.models.ingredient_unit import IngredientUnit
from app.models.unit_group import UnitGroup
from app.schemas.ingredient import (
    IngredientBase,
    IngredientData,
    IngredientImageData,
    IngredientRead,
    IngredientSearchResult,
    IngredientUpdateData,
)
from app.schemas.ingredient_type import IngredientTypeRead
from app.schemas.ingredient_unit import IngredientUnitRead

ingredient_quantity_left_subquery = (
    select(
        Ingredient.id.label("ingredient_id"),
        func.coalesce(func.sum(ingredient_stock_left_subquery.c.total_left), 0).label(
            "quantity_left"
        ),
    )
    .outerjoin(
        ingredient_stock_left_subquery,
        and_(
            ingredient_stock_left_subquery.c.ref_ingredient_id == Ingredient.id,
            ingredient_stock_left_subquery.c.ingredient_stock_state > 0,
        ),
    )
    .group_by(Ingredient.id)
    .subquery()
)


class IngredientCRUD:
    async def create(self, db: AsyncSession, data: IngredientData) -> IngredientBase:
        new_ingredient = Ingredient(**data.model_dump(exclude={"unit"}))
        db.add(new_ingredient)
        await db.flush()
        await db.refresh(new_ingredient)
        return new_ingredient

    async def set_image(
        self, db: AsyncSession, image: IngredientImageData
    ) -> IngredientRead | None:
        """
        Update ingredients image fields
        """
        ingredient = await db.scalar(
            select(Ingredient).where(Ingredient.id == image.id, Ingredient.state > 0)
        )
        if not ingredient:
            return None

        ingredient.image_url = image.image_url
        ingredient.storage_key = image.storage_key
        ingredient.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(ingredient)

        return await ingredient_crud_instance.get_one(db, ingredient.id)

    async def get_one(
        self, db: AsyncSession, ingredient_id: str
    ) -> IngredientRead | None:
        result = await db.execute(
            select(
                Ingredient,
                IngredientUnit,
                IngredientType,
                ingredient_quantity_left_subquery.c.quantity_left,
                UnitGroup.name,
            )
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .outerjoin(UnitGroup, UnitGroup.id == IngredientUnit.ref_unit_group_id)
            .join(
                ingredient_quantity_left_subquery,
                ingredient_quantity_left_subquery.c.ingredient_id == Ingredient.id,
            )
            .join(
                IngredientType, IngredientType.id == Ingredient.ref_ingredient_type_id
            )
            .where(Ingredient.state > 0, Ingredient.id == ingredient_id)
        )

        row = result.one_or_none()
        if row is None:
            return None

        return IngredientRead(
            ingredient=row[0],
            ingredient_unit=row[1],
            ingredient_type=row[2],
            quantity_left=row[3],
            group_name=row[4],
        )

    async def search_with_pagination(
        self,
        db: AsyncSession,
        name: str | None = None,
        ingredient_type_id: str | None = None,
        min_stock: Decimal | None = None,
        sort_by: str | None = None,
        sort_direction: str = "asc",
        offset: int = 0,
        limit: int = 20,
    ) -> IngredientSearchResult:

        SORT_COLUMNS = {
            "unit_cost": (
                Ingredient.estimated_price
                / func.coalesce(IngredientUnit.multiplier_to_base, 1)
            ),
            "quantity_left": (
                ingredient_quantity_left_subquery.c.quantity_left
                * func.coalesce(IngredientUnit.multiplier_to_base, 1)
            ),
        }
        query = (
            select(
                Ingredient,
                IngredientUnit,
                IngredientType,
                ingredient_quantity_left_subquery.c.quantity_left,
                UnitGroup.name,
            )
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .outerjoin(UnitGroup, UnitGroup.id == IngredientUnit.ref_unit_group_id)
            .join(
                ingredient_quantity_left_subquery,
                ingredient_quantity_left_subquery.c.ingredient_id == Ingredient.id,
            )
            .join(
                IngredientType, IngredientType.id == Ingredient.ref_ingredient_type_id
            )
            .where(Ingredient.state > 0)
        )
        count_query = (
            select(func.count(Ingredient.id))
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .outerjoin(UnitGroup, UnitGroup.id == IngredientUnit.ref_unit_group_id)
            .join(
                ingredient_quantity_left_subquery,
                ingredient_quantity_left_subquery.c.ingredient_id == Ingredient.id,
            )
            .join(
                IngredientType, IngredientType.id == Ingredient.ref_ingredient_type_id
            )
            .where(Ingredient.state > 0)
        )

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(Ingredient.name.ilike(pattern))
            count_query = count_query.where(Ingredient.name.ilike(pattern))

        if ingredient_type_id:
            query = query.where(Ingredient.ref_ingredient_type_id == ingredient_type_id)
            count_query = count_query.where(
                Ingredient.ref_ingredient_type_id == ingredient_type_id
            )
        if min_stock:
            query = query.where(
                ingredient_quantity_left_subquery.c.quantity_left >= min_stock
            )
            count_query = count_query.where(
                ingredient_quantity_left_subquery.c.quantity_left >= min_stock
            )
        # Order
        sort_column = SORT_COLUMNS.get(sort_by) if sort_by else None

        if sort_column is not None:
            if sort_direction.lower() == "desc":
                sort_column = sort_column.desc()
            else:
                sort_column = sort_column.asc()

            query = query.order_by(
                IngredientUnit.ref_unit_group_id,
                sort_column,
                Ingredient.name,
            )
        else:
            query = query.order_by(
                IngredientUnit.ref_unit_group_id,
                Ingredient.name,
            )

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        total = await db.scalar(count_query)

        items = [
            IngredientRead(
                ingredient=row[0],
                ingredient_unit=row[1],
                ingredient_type=row[2],
                quantity_left=row[3],
                group_name=row[4],
            )
            for row in rows
        ]

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    async def select_type_search(
        self,
        db: AsyncSession,
        name: str | None = None,
    ) -> list[IngredientTypeRead]:
        query = select(IngredientType).where(IngredientType.state > 0)

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(IngredientType.name.ilike(pattern))

        # Order
        query = query.order_by(IngredientType.name)

        # Execute
        result = await db.execute(query)
        items = result.scalars().all()

        return items

    async def select_unit_search(
        self,
        db: AsyncSession,
        name: str | None = None,
    ) -> list[IngredientUnitRead]:
        query = select(IngredientUnit).where(IngredientUnit.state > 0)

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(IngredientUnit.name.ilike(pattern))

        # Order
        query = query.order_by(IngredientUnit.multiplier_to_base)

        # Execute
        result = await db.execute(query)
        items = result.scalars().all()

        return items

    async def select_search(
        self,
        db: AsyncSession,
        name: str | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> list[IngredientBase]:
        query = (
            select(Ingredient, IngredientUnit.symbol)
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .where(Ingredient.state > 0)
        )

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(Ingredient.name.ilike(pattern))

        # Order
        query = query.order_by(Ingredient.name)

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        return [
            IngredientBase(
                **ingredient.__dict__,
                unit=symbol,
            )
            for ingredient, symbol in rows
        ]

    async def update(
        self, db: AsyncSession, data: IngredientUpdateData
    ) -> IngredientRead | None:
        """
        Update ingredients core fields
        """
        ingredient = await db.scalar(
            select(Ingredient).where(Ingredient.id == data.id, Ingredient.state > 0)
        )
        if not ingredient:
            return None

        # Update ingredients fields (exclude id)
        payload = data.model_dump(exclude_unset=True, exclude_none=True, exclude={"id"})
        for key, value in payload.items():
            setattr(ingredient, key, value)

        ingredient.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(ingredient)

        return await ingredient_crud_instance.get_one(db, ingredient.id)


ingredient_crud_instance = IngredientCRUD()
