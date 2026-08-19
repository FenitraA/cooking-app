from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, case, func, select, update

from app.models.ingredient import Ingredient
from app.models.ingredient_unit import IngredientUnit
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.schemas.recipe import (
    RecipeBase,
    RecipeCreate,
    RecipeCreateResponse,
    RecipeImageData,
    RecipeIngredientBase,
    RecipeIngredientRead,
    RecipeRead,
    RecipeSearchResult,
    RecipeUpdateData,
)

recipe_cost_price_subquery = (
    select(
        Recipe.id.label("recipe_id"),
        func.coalesce(
            func.sum(
                case(
                    (
                        RecipeIngredient.state > 0,
                        RecipeIngredient.quantity * Ingredient.estimated_price,
                    ),
                    else_=0,
                )
            ),
            0,
        ).label("estimated_cost_price"),
    )
    .outerjoin(
        RecipeIngredient,
        RecipeIngredient.ref_recipe_id == Recipe.id,
    )
    .outerjoin(
        Ingredient,
        Ingredient.id == RecipeIngredient.ref_ingredient_id,
    )
    .where(Recipe.state > 0)
    .group_by(Recipe.id)
    .subquery()
)


class RecipeCRUD:
    async def create(
        self, db: AsyncSession, data: RecipeCreate
    ) -> RecipeCreateResponse:
        new_recipe = Recipe(**data.model_dump(exclude={"recipe_ingredients"}))
        db.add(new_recipe)
        await db.flush()
        await db.refresh(new_recipe)

        new_recipe_ingredients: list[RecipeIngredientBase] = []
        # Add recipe ingredients

        new_insertion_id = RecipeIngredient.generate_insertion_id()
        for recipe_ingredient in data.recipe_ingredients:
            recipe_ingredient.insertion_id = new_insertion_id
            recipe_ingredient.ref_recipe_id = new_recipe.id
            new_recipe_ingredients.append(
                await recipe_crud_instance.create_recipe_ingredient(
                    db, recipe_ingredient
                )
            )
        return RecipeCreateResponse(
            recipe=new_recipe, recipe_ingredients=new_recipe_ingredients
        )

    async def set_image(
        self, db: AsyncSession, household_id: str, images: RecipeImageData
    ) -> RecipeRead | None:
        """
        Update recipe image fields
        """
        recipe = await db.scalar(
            select(Recipe).where(
                Recipe.ref_household_id == household_id,
                Recipe.id == images.id,
                Recipe.state > 0,
            )
        )
        if not recipe:
            return None

        recipe.image_url = images.image_url
        recipe.storage_key = images.storage_key
        recipe.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(recipe)

        return await recipe_crud_instance.get_one(db,household_id, recipe.id)

    async def create_recipe_ingredient(
        self, db: AsyncSession, data: RecipeIngredientBase
    ) -> RecipeIngredientBase:
        new_recipe_ingredient = RecipeIngredient(**data.model_dump())
        db.add(new_recipe_ingredient)
        await db.flush()
        await db.refresh(new_recipe_ingredient)

        return new_recipe_ingredient

    async def get_recipe_ingredients(
        self, db: AsyncSession, recipe_id: str
    ) -> list[RecipeIngredientRead]:
        result = await db.execute(
            select(
                RecipeIngredient,
                Recipe.name,
                Ingredient.name,
                IngredientUnit.symbol.label("unit"),
                Ingredient.estimated_price,
            )
            .join(Recipe, Recipe.id == RecipeIngredient.ref_recipe_id)
            .join(Ingredient, Ingredient.id == RecipeIngredient.ref_ingredient_id)
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .where(
                RecipeIngredient.ref_recipe_id == recipe_id,
                RecipeIngredient.state > 0,
            )
        )
        rows = result.all()
        return [
            RecipeIngredientRead(
                recipe_ingredient_base=row[0],
                recipe_name=row[1],
                ingredient_name=row[2],
                ingredient_unit=row[3],
                estimated_cost_per_unit=row[4],
            )
            for row in rows
        ]

    async def get_recipe_ingredients_batch(
        self, db: AsyncSession, recipe_ids: list[str]
    ) -> list[RecipeIngredientRead]:
        result = await db.execute(
            select(
                RecipeIngredient,
                Recipe.name,
                Ingredient.name,
                IngredientUnit.symbol.label("unit"),
                Ingredient.estimated_price,
            )
            .join(Recipe, Recipe.id == RecipeIngredient.ref_recipe_id)
            .join(Ingredient, Ingredient.id == RecipeIngredient.ref_ingredient_id)
            .outerjoin(
                IngredientUnit, IngredientUnit.id == Ingredient.ref_ingredient_unit_id
            )
            .where(
                RecipeIngredient.ref_recipe_id.in_(recipe_ids),
                RecipeIngredient.state > 0,
            )
        )
        rows = result.all()
        return [
            RecipeIngredientRead(
                recipe_ingredient_base=row[0],
                recipe_name=row[1],
                ingredient_name=row[2],
                ingredient_unit=row[3],
                estimated_cost_per_unit=row[4],
            )
            for row in rows
        ]

    async def get_one(
        self, db: AsyncSession, household_id: str, recipe_ingredient: str
    ) -> RecipeRead | None:

        result = await db.execute(
            select(Recipe, recipe_cost_price_subquery.c.estimated_cost_price)
            .join(
                recipe_cost_price_subquery,
                recipe_cost_price_subquery.c.recipe_id == Recipe.id,
            )
            .where(
                Recipe.ref_household_id == household_id,
                Recipe.state > 0,
                Recipe.id == recipe_ingredient,
            )
        )

        row = result.one_or_none()
        if row is None:
            return None

        return RecipeRead(
            recipe=row[0],
            estimated_cost_price=row[1],
            recipe_ingredients=await recipe_crud_instance.get_recipe_ingredients(
                db, row[0].id
            ),
        )

    async def select_search(
        self,
        db: AsyncSession,
        household_id: str,
        name: str | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> list[RecipeBase]:
        query = select(Recipe).where(Recipe.state > 0)

        # Filters
        query = query.where(Recipe.ref_household_id == household_id)
        if name:
            pattern = f"%{name}%"
            query = query.where(Recipe.name.ilike(pattern))

        # Order
        query = query.order_by(Recipe.name)

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        items = result.scalars().all()

        return items

    async def search_with_pagination(
        self,
        db: AsyncSession,
        household_id: str,
        name: str | None = None,
        max_making_time: int | None = None,
        ingredient_ids: list[str] = [],
        offset: int = 0,
        limit: int = 20,
    ) -> RecipeSearchResult:

        unique_target_ids = list(set(ingredient_ids))
        target_count = len(unique_target_ids)

        recipe_ingredient_subquery = (
            select(
                Recipe.id.label("recipe_id"),
                func.sum(
                    case(
                        (
                            and_(
                                RecipeIngredient.ref_ingredient_id.in_(
                                    unique_target_ids
                                ),
                                RecipeIngredient.state > 0,
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ).label("match_count"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                RecipeIngredient.state > 0,
                                RecipeIngredient.quantity * Ingredient.estimated_price,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("estimated_cost_price"),
            )
            .outerjoin(
                RecipeIngredient,
                RecipeIngredient.ref_recipe_id == Recipe.id,
            )
            .outerjoin(
                Ingredient,
                Ingredient.id == RecipeIngredient.ref_ingredient_id,
            )
            .where(Recipe.state > 0)
            .group_by(Recipe.id)
            .subquery()
        )

        query = (
            select(Recipe, recipe_ingredient_subquery.c.estimated_cost_price)
            .join(
                recipe_ingredient_subquery,
                recipe_ingredient_subquery.c.recipe_id == Recipe.id,
            )
            .where(Recipe.state > 0)
        )
        count_query = (
            select(func.count(Recipe.id))
            .join(
                recipe_ingredient_subquery,
                recipe_ingredient_subquery.c.recipe_id == Recipe.id,
            )
            .where(Recipe.state > 0)
        )

        # Filters
        query = query.where(Recipe.ref_household_id == household_id)
        count_query = count_query.where(Recipe.ref_household_id == household_id)

        if name:
            pattern = f"%{name}%"
            query = query.where(Recipe.name.ilike(pattern))
            count_query = count_query.where(Recipe.name.ilike(pattern))

        if max_making_time:
            query = query.where(Recipe.estimated_time <= max_making_time)
            count_query = count_query.where(Recipe.estimated_time <= max_making_time)

        # Ingredients ids
        if len(ingredient_ids) > 0:
            # Ensure we are dealing with unique IDs to avoid count mismatches

            query = query.where(
                recipe_ingredient_subquery.c.match_count == target_count
            )
            count_query = count_query.where(
                recipe_ingredient_subquery.c.match_count == target_count
            )

        # Order
        query = query.order_by(Recipe.name)

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        total = await db.scalar(count_query)

        # Get Recipe ingredients
        recipe_ids = [row[0].id for row in rows]
        recipe_ingredients_batch = (
            await recipe_crud_instance.get_recipe_ingredients_batch(db, recipe_ids)
        )

        # group them in dict
        ingredients_by_recipe = defaultdict(list)
        for recipe_ingredient in recipe_ingredients_batch:

            ingredients_by_recipe[
                recipe_ingredient.recipe_ingredient_base.ref_recipe_id
            ].append(recipe_ingredient)

        items = [
            RecipeRead(
                recipe=row[0],
                estimated_cost_price=row[1],
                recipe_ingredients=ingredients_by_recipe[row[0].id],
            )
            for row in rows
        ]

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    async def soft_delete_recipe_ingredients(self, db: AsyncSession, recipe_id: str):
        stmt = (
            update(RecipeIngredient)
            .where(
                RecipeIngredient.ref_recipe_id == recipe_id, RecipeIngredient.state > 0
            )
            .values(state=-1, updated_at=datetime.now(timezone.utc))
        )

        await db.execute(stmt)
        return

    async def update(
        self, db: AsyncSession, household_id: str, data: RecipeUpdateData
    ) -> RecipeRead | None:
        """
        Update recipe core fields + replace ingredients list.
        """
        recipe = await db.scalar(
            select(Recipe).where(
                Recipe.ref_household_id == household_id,
                Recipe.id == data.id,
                Recipe.state > 0,
            )
        )
        if not recipe:
            return None

        # Update household fields (exclude members + id)
        payload = data.model_dump(
            exclude={"recipe_ingredients"}, exclude_unset=True, exclude_none=True
        )
        for key, value in payload.items():
            setattr(recipe, key, value)

        if data.recipe_ingredients is not None:
            new_insertion_id = RecipeIngredient.generate_insertion_id()

            # delete old recipe_ingredients

            await recipe_crud_instance.soft_delete_recipe_ingredients(db, recipe.id)

            # create new ones
            for recipe_ingredient in data.recipe_ingredients:
                recipe_ingredient.ref_recipe_id = recipe.id
                recipe_ingredient.insertion_id = new_insertion_id
                await recipe_crud_instance.create_recipe_ingredient(
                    db, recipe_ingredient
                )

        recipe.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(recipe)

        return await recipe_crud_instance.get_one(db,household_id, recipe.id)


recipe_crud_instance = RecipeCRUD()
