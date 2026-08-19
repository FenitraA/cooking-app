from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, case, exists, func, select

from app.models.meal import Meal
from app.models.planning_recipe import PlanningRecipe
from app.models.recipe import Recipe
from app.schemas.planning_recipe import (
    PlanningRecipeBase,
    PlanningRecipeCreate,
    PlanningRecipeData,
    PlanningRecipeRead,
    PlanningRecipeUpdateData,
)
from app.crud.recipe_crud import recipe_cost_price_subquery, recipe_crud_instance


class PlanningCRUD:
    async def create_many(
        self,
        db: AsyncSession,
        data: PlanningRecipeCreate,
    ) -> list[PlanningRecipe]:
        planning_recipes = [
            PlanningRecipe(
                **data.model_dump(exclude={"planning_dates","planning_date"}),
                planning_date=planning_date,
            )
            for planning_date in data.planning_dates
        ]

        db.add_all(planning_recipes)
        await db.flush()

        return planning_recipes

    async def get_one(
        self, db: AsyncSession, household_id: str, planning_recipe_id: str
    ) -> PlanningRecipeRead | None:
        result = await db.execute(
            select(
                PlanningRecipe,
                Recipe,
                recipe_cost_price_subquery.c.estimated_cost_price
                * PlanningRecipe.nb_serving,
            )
            .join(Recipe, Recipe.id == PlanningRecipe.ref_recipe_id)
            .join(
                recipe_cost_price_subquery,
                recipe_cost_price_subquery.c.recipe_id == PlanningRecipe.ref_recipe_id,
            )
            .where(
                PlanningRecipe.ref_household_id == household_id,
                PlanningRecipe.state > 0,
                PlanningRecipe.id == planning_recipe_id,
            )
        )

        row = result.one_or_none()
        if row is None:
            return None

        # Get Recipe ingredients
        recipe_ingredients = await recipe_crud_instance.get_recipe_ingredients(
            db, row[1].id
        )

        return PlanningRecipeRead(
            planning_recipe=row[0],
            recipe=row[1],
            is_done=False,
            estimated_cost_price=row[2],
            recipe_ingredients=recipe_ingredients,
        )

    async def get_by_date(
        self,
        db: AsyncSession,
        household_id: str,
        start_of_week: date,
        end_of_week: date,
    ) -> list[PlanningRecipeRead]:

        # meal_done_subquery = select(
        #     PlanningRecipe.id.label("planning_id"),
        #     case(
        #         (
        #             exists().where(
        #                 and_(
        #                     Meal.ref_recipe_id == PlanningRecipe.ref_recipe_id,
        #                     func.date(Meal.created_at)
        #                     == func.date(PlanningRecipe.created_at),
        #                 )
        #             ),
        #             True,
        #         ),
        #         else_=False,
        #     ).label("is_done"),
        # ).subquery()

        query = (
            select(
                PlanningRecipe,
                Recipe,
                recipe_cost_price_subquery.c.estimated_cost_price
                * PlanningRecipe.nb_serving,
            )
            .join(Recipe, Recipe.id == PlanningRecipe.ref_recipe_id)
            .join(
                recipe_cost_price_subquery,
                recipe_cost_price_subquery.c.recipe_id == PlanningRecipe.ref_recipe_id,
            )
            .where(PlanningRecipe.state > 0)
        )

        # Filters
        query = query.where(
            PlanningRecipe.ref_household_id == household_id,
            PlanningRecipe.created_at >= start_of_week,
            PlanningRecipe.created_at < (end_of_week + timedelta(days=1)),
        )

        # Execute
        result = await db.execute(query)
        rows = result.all()

        # Get Recipe ingredients
        recipe_ids = [row[1].id for row in rows]
        recipe_ingredients_batch = (
            await recipe_crud_instance.get_recipe_ingredients_batch(db, recipe_ids)
        )

        # group them in dict
        ingredients_by_recipe = defaultdict(list)
        for recipe_ingredient in recipe_ingredients_batch:

            ingredients_by_recipe[
                recipe_ingredient.recipe_ingredient_base.ref_recipe_id
            ].append(recipe_ingredient)

        return [
            PlanningRecipeRead(
                planning_recipe=row[0],
                recipe=row[1],
                is_done=False,
                estimated_cost_price=row[2],
                recipe_ingredients=ingredients_by_recipe[row[1].id],
            )
            for row in rows
        ]

    async def soft_delete(
        self, db: AsyncSession, household_id: str, planning_recipe_id: str
    ) -> PlanningRecipeBase:
        planning_recipe = await db.scalar(
            select(PlanningRecipe).where(
                PlanningRecipe.ref_household_id == household_id,
                PlanningRecipe.id == planning_recipe_id,
                PlanningRecipe.state > 0,
            )
        )
        if not planning_recipe:
            return None

        planning_recipe.state = -1
        planning_recipe.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return planning_recipe

    async def update(
        self, db: AsyncSession, household_id: str, data: PlanningRecipeUpdateData
    ) -> PlanningRecipeRead | None:
        """
        Update planning recipe core fields
        """
        planning_recipe = await db.scalar(
            select(PlanningRecipe).where(
                PlanningRecipe.ref_household_id == household_id,
                PlanningRecipe.id == data.id,
                PlanningRecipe.state > 0,
            )
        )
        if not planning_recipe:
            return None

        # Update ingredients fields (exclude id and None fields)
        payload = data.model_dump(exclude_unset=True, exclude_none=True, exclude={"id"})
        for key, value in payload.items():
            setattr(planning_recipe, key, value)

        planning_recipe.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(planning_recipe)

        return await planning_crud_instance.get_one(db, planning_recipe.id)

    async def generate_pdf(
        self, db: AsyncSession, household_id: str, start_date: date, end_date: date
    ):
        return


planning_crud_instance = PlanningCRUD()
