from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, case, func, select

from app.models.ingredient import Ingredient
from app.models.ingredient_stock import IngredientStock
from app.models.ingredient_unit import IngredientUnit
from app.models.meal import Meal
from app.models.meal_ingredient import MealIngredient
from app.models.seller import Seller
from app.schemas.exceptions import IngredientStockHouseholdMismatchError
from app.schemas.ingredient_stock import (
    IngredientStockBase,
    IngredientStockData,
    IngredientStockRead,
)

ingredient_stock_left_subquery = (
    select(
        IngredientStock.id.label("ingredient_stock_id"),
        IngredientStock.ref_ingredient_id,
        (
            IngredientStock.quantity
            - func.coalesce(
                func.sum(
                    case(
                        (
                            and_(MealIngredient.state > 0, Meal.state > 0),
                            MealIngredient.quantity,
                        ),
                        else_=0,
                    )
                ),
                0,
            )
        ).label("total_left"),
        IngredientStock.state.label("ingredient_stock_state"),
    )
    .outerjoin(
        MealIngredient, MealIngredient.ref_ingredient_stock_id == IngredientStock.id
    )
    .outerjoin(Meal, Meal.id == MealIngredient.ref_meal_id)
    .group_by(
        IngredientStock.id,
        IngredientStock.quantity,
        IngredientStock.ref_ingredient_id,
        IngredientStock.state,
    )
    .subquery()
)


class IngredientStockCRUD:
    async def create(
        self, db: AsyncSession, data: IngredientStockData
    ) -> IngredientStockBase:
        new_ingredient_stock = IngredientStock(**data.model_dump())
        db.add(new_ingredient_stock)
        await db.flush()
        await db.refresh(new_ingredient_stock)
        return new_ingredient_stock

    async def soft_delete(
        self, db: AsyncSession, household_id: str, ingredient_stock_id: str
    ) -> IngredientStockBase:
        ingredient_stock = await db.scalar(
            select(IngredientStock).where(
                IngredientStock.ref_household_id == household_id,
                IngredientStock.id == ingredient_stock_id,
                IngredientStock.state > 0,
            )
        )
        if not ingredient_stock:
            return None

        ingredient_stock.state = -1
        ingredient_stock.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return ingredient_stock

    async def get_stocks_by_ingredient(
        self,
        db: AsyncSession,
        household_id: str,
        ingredient_id: str,
        offset: int = 0,
        limit: int = 10,
    ) -> list[IngredientStockRead]:
        query = (
            select(
                IngredientStock,
                Ingredient.name,
                IngredientUnit.symbol.label("unit"),
                Seller.name,
                ingredient_stock_left_subquery.c.total_left,
            )
            .join(Ingredient, Ingredient.id == IngredientStock.ref_ingredient_id)
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .join(Seller, Seller.id == IngredientStock.ref_seller_id)
            .join(
                ingredient_stock_left_subquery,
                ingredient_stock_left_subquery.c.ingredient_stock_id
                == IngredientStock.id,
            )
            .where(IngredientStock.state > 0)
        )

        query = query.where(IngredientStock.ref_household_id == household_id)
        query = query.where(IngredientStock.ref_ingredient_id == ingredient_id)

        # Order
        query = query.order_by(
            IngredientStock.created_at,
        )

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        return [
            IngredientStockRead(
                ingredient_stock=row[0],
                ingredient_name=row[1],
                ingredient_unit=row[2],
                seller_name=row[3],
                quantity_left=row[4],
            )
            for row in rows
        ]

    async def get_ingredient_unit_ids_from_stock_ids(
        self, db: AsyncSession, ids: list[str]
    ) -> dict[str, str | None]:
        query = (
            select(IngredientStock.id, IngredientUnit.id)
            .join(Ingredient, Ingredient.id == IngredientStock.ref_ingredient_id)
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .where(IngredientStock.id.in_(ids))
        )

        # Execute
        result = await db.execute(query)
        rows = result.all()

        return {stock_id: unit_id for stock_id, unit_id in rows}

    async def check_stocks_quantities(
        self,
        db: AsyncSession,
        household_id: str,
        stock_ids: list[str],
    ):
        ingredient_stocks = (
            await db.scalars(
                select(IngredientStock)
                .join(
                    ingredient_stock_left_subquery,
                    ingredient_stock_left_subquery.c.ingredient_stock_id
                    == IngredientStock.id,
                )
                .where(
                    IngredientStock.ref_household_id == household_id,
                    IngredientStock.id.in_(stock_ids),
                    IngredientStock.state > 0,
                    ingredient_stock_left_subquery.c.total_left <= 0,
                )
            )
        ).all()

        if not ingredient_stocks:
            return

        for ingredient_stock in ingredient_stocks:
            ingredient_stock.state = -1
            ingredient_stock.updated_at = datetime.now(timezone.utc)

        await db.flush()

    async def check_stocks_households(
        self,
        db: AsyncSession,
        stock_ids: list[str],
        household_id: str,
    ) -> None:
        stocks = (
            (
                await db.execute(
                    select(IngredientStock).where(IngredientStock.id.in_(stock_ids))
                )
            )
            .scalars()
            .all()
        )

        invalid_stock_ids = [
            stock.id for stock in stocks if stock.ref_household_id != household_id
        ]

        if invalid_stock_ids:
            raise IngredientStockHouseholdMismatchError(
                f"Stocks do not belong to your household: "
                f"{', '.join(invalid_stock_ids)}"
            )

    async def get_stocks_by_ingredient_by_batch(
        self,
        db: AsyncSession,
        household_id: str,
        ingredient_ids: list[str],
        offset: int = 0,
        limit: int = 10,
    ) -> list[IngredientStockRead]:
        query = (
            select(
                IngredientStock,
                Ingredient.name,
                IngredientUnit.symbol.label("unit"),
                Seller.name,
                ingredient_stock_left_subquery.c.total_left,
            )
            .join(Ingredient, Ingredient.id == IngredientStock.ref_ingredient_id)
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .join(Seller, Seller.id == IngredientStock.ref_seller_id)
            .join(
                ingredient_stock_left_subquery,
                ingredient_stock_left_subquery.c.ingredient_stock_id
                == IngredientStock.id,
            )
            .where(IngredientStock.state > 0)
        )

        query = query.where(IngredientStock.ref_household_id == household_id)
        query = query.where(IngredientStock.ref_ingredient_id.in_(ingredient_ids))

        # Order
        query = query.order_by(
            IngredientStock.ref_ingredient_id,
            IngredientStock.created_at,
        )

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        return [
            IngredientStockRead(
                ingredient_stock=row[0],
                ingredient_name=row[1],
                ingredient_unit=row[2],
                seller_name=row[3],
                quantity_left=row[4],
            )
            for row in rows
        ]


ingredient_stock_crud_instance = IngredientStockCRUD()
