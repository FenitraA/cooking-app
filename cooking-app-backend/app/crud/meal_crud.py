from collections import defaultdict
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, func, select

from app.models.ingredient import Ingredient
from app.models.ingredient_stock import IngredientStock
from app.models.ingredient_unit import IngredientUnit
from app.models.meal import Meal
from app.models.meal_ingredient import MealIngredient
from app.models.recipe import Recipe
from app.models.seller import Seller
from app.schemas.exceptions import NotEnoughStock
from app.schemas.ingredient_stock import IngredientStockRead
from app.schemas.meal import (
    MealBase,
    MealCreate,
    MealCreateResponse,
    MealIngredientBase,
    MealIngredientRead,
    MealRead,
    MealSearchResult,
)
from app.crud.recipe_crud import recipe_crud_instance
from app.crud.ingredient_stock_crud import ingredient_stock_crud_instance
from app.crud.ingredient_crud import ingredient_crud_instance


class MealCRUD:
    async def create(self, db: AsyncSession, data: MealCreate) -> MealCreateResponse:
        new_meal = Meal(**data.model_dump(exclude={"meal_ingredients"}))
        db.add(new_meal)
        await db.flush()
        await db.refresh(new_meal)

        ingredient_stock_ids = [
            meal_ingredient.ref_ingredient_stock_id
            for meal_ingredient in data.meal_ingredients
        ]
        units = (
            await ingredient_stock_crud_instance.get_ingredient_unit_ids_from_stock_ids(
                db, ingredient_stock_ids
            )
        )
        new_meal_ingredients: list[MealIngredientBase] = []
        # Add recipe ingredients

        for meal_ingredient in data.meal_ingredients:
            meal_ingredient.ref_ingredient_unit_id = units[
                meal_ingredient.ref_ingredient_stock_id
            ]
            meal_ingredient.ref_meal_id = new_meal.id
            new_meal_ingredients.append(
                await meal_crud_instance.create_meal_ingredient(db, meal_ingredient)
            )

        await ingredient_stock_crud_instance.check_stocks_quantities(
            db, ingredient_stock_ids
        )
        await ingredient_stock_crud_instance.check_stocks_households(
            db, ingredient_stock_ids
        )
        return MealCreateResponse(meal=new_meal, meal_ingredients=new_meal_ingredients)

    async def create_meal_ingredient(
        self, db: AsyncSession, data: MealIngredientBase
    ) -> MealIngredientBase:
        new_recipe = MealIngredient(**data.model_dump())
        db.add(new_recipe)
        await db.flush()
        await db.refresh(new_recipe)

        return new_recipe

    async def get_meal_ingredients(
        self, db: AsyncSession, meal_id: str
    ) -> list[MealIngredientRead]:
        query = (
            select(
                MealIngredient,
                Seller.name,
                Ingredient.name,
                IngredientUnit.symbol.label("unit"),
                IngredientStock.unit_cost,
                (IngredientStock.unit_cost * MealIngredient.quantity).label(
                    "total_price"
                ),
            )
            .join(
                IngredientStock,
                IngredientStock.id == MealIngredient.ref_ingredient_stock_id,
            )
            .join(Seller, Seller.id == IngredientStock.ref_seller_id)
            .join(
                Ingredient,
                Ingredient.id == IngredientStock.ref_ingredient_id,
            )
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .where(MealIngredient.ref_meal_id == meal_id, MealIngredient.state > 0)
        )
        result = await db.execute(query)
        rows = result.all()
        return [
            MealIngredientRead(
                meal_ingredient_base=row[0],
                seller_name=row[1],
                ingredient_name=row[2],
                ingredient_unit=row[3],
                unit_cost=row[4],
                total_price=row[5],
            )
            for row in rows
        ]

    async def get_meal_recipe_setup(
        self, db: AsyncSession, household_id: str, recipe_id: str, nb_serving: int
    ) -> list[MealIngredientRead]:
        recipe = await recipe_crud_instance.get_one(db, recipe_id)

        # Get ingredients stocks
        ingredient_ids = [
            recipe_ingredient.recipe_ingredient_base.ref_ingredient_id
            for recipe_ingredient in recipe.recipe_ingredients
        ]
        ingredient_stocks_batch = (
            await ingredient_stock_crud_instance.get_stocks_by_ingredient_by_batch(
                db, household_id, ingredient_ids
            )
        )

        # group them in dict
        stocks_by_ingredient = defaultdict(list[IngredientStockRead])
        for ingredient_stock in ingredient_stocks_batch:

            stocks_by_ingredient[
                ingredient_stock.ingredient_stock.ref_ingredient_id
            ].append(ingredient_stock)

        # Allocation
        allocations: list[MealIngredientRead] = []

        for recipe_ingredient in recipe.recipe_ingredients:

            ingredient_name = recipe_ingredient.ingredient_name
            ingredient_unit = recipe_ingredient.ingredient_unit
            ingredient_id = recipe_ingredient.recipe_ingredient_base.ref_ingredient_id
            required = recipe_ingredient.recipe_ingredient_base.quantity * nb_serving

            for stock in stocks_by_ingredient[ingredient_id]:
                print(stock.quantity_left)
                if required <= 0:
                    break

                if stock.quantity_left > 0:
                    used = min(required, stock.quantity_left)

                    allocations.append(
                        MealIngredientRead(
                            meal_ingredient_base=MealIngredientBase(
                                ref_meal_id="",
                                ref_ingredient_unit_id="",
                                ref_ingredient_stock_id=stock.ingredient_stock.id,
                                quantity=used,
                            ),
                            seller_name=stock.seller_name,
                            ingredient_name=recipe_ingredient.ingredient_name,
                            ingredient_unit=recipe_ingredient.ingredient_unit,
                            unit_cost=stock.ingredient_stock.unit_cost,
                            total_price=stock.ingredient_stock.unit_cost * used,
                        )
                    )

                    required -= used

            if required > 0:
                raise NotEnoughStock(
                    ingredient_name,
                    ingredient_unit,
                    missing_quantity=required,
                )
        return allocations

    async def soft_delete(self, db: AsyncSession, meal_id: str) -> MealBase:
        meal = await db.scalar(select(Meal).where(Meal.id == meal_id, Meal.state > 0))
        if not meal:
            return None

        meal.state = -1
        meal.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return meal

    async def search_with_pagination(
        self,
        db: AsyncSession,
        recipe_name: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> MealSearchResult:
        query = (
            select(
                Meal,
                Recipe.name,
            )
            .join(Recipe, Recipe.id == Meal.ref_recipe_id)
            .where(Meal.state > 0)
        )
        count_query = (
            select(func.count(Meal.id))
            .join(Recipe, Recipe.id == Meal.ref_recipe_id)
            .where(Meal.state > 0)
        )

        # Filters
        if recipe_name:
            pattern = f"%{recipe_name}%"
            query = query.where(Recipe.name.ilike(pattern))
            count_query = count_query.where(Recipe.name.ilike(pattern))

        if start_date:
            query = query.where(Meal.created_at >= start_date)
            count_query = count_query.where(Meal.created_at >= start_date)

        if end_date:
            query = query.where(Meal.created_at <= end_date)
            count_query = count_query.where(Meal.created_at <= end_date)

        # Order
        query = query.order_by(desc(Meal.created_at))

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        total = await db.scalar(count_query)

        items = []

        for row in rows:
            meal_ingredients = await meal_crud_instance.get_meal_ingredients(
                db, row[0].id
            )

            total_cost_price = sum(
                meal_ingredient.total_price for meal_ingredient in meal_ingredients
            )

            items.append(
                MealRead(
                    meal=row[0],
                    recipe_name=row[1],
                    total_cost_price=total_cost_price,
                    meal_ingredients=meal_ingredients,
                )
            )

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }


meal_crud_instance = MealCRUD()
