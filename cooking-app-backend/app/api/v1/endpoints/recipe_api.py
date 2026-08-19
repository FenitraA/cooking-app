from datetime import date

from fastapi import APIRouter, Depends, Query, Request

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.decorators import handle_endpoint_errors
from app.core.security import require_roles
from app.core.security import limiter
from app.crud.recipe_crud import recipe_crud_instance
from app.crud.meal_crud import meal_crud_instance
from app.db.database import get_db
from app.schemas.meal import DeleteMealData, MealBase, MealCreate, MealCreateResponse, MealIngredientRead, MealSearchResult
from app.schemas.recipe import (
    RecipeBase,
    RecipeCreate,
    RecipeCreateResponse,
    RecipeImageData,
    RecipeRead,
    RecipeSearchResult,
    RecipeUpdateData,
)
from app.core.config import settings

router = APIRouter(tags=["Recipes"])


@router.post("", response_model=RecipeCreateResponse)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_recipe(
    request : Request,
    data: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    data.ref_household_id  = current_user["ref_household_id"]
    result = await recipe_crud_instance.create(db, data)
    await db.commit()
    return result

@router.put("/image", response_model=RecipeRead)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def set_recipe_image(
    request: Request,
    data: RecipeImageData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
    
):
    household_id  = current_user["ref_household_id"]
    result = await recipe_crud_instance.set_image(db,household_id, data)
    await db.commit()
    return result

@router.get("", response_model=RecipeSearchResult)
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def search_recipes(
    request : Request,
    name: str | None = None,
    max_making_time: int | None = None,
    ingredient_ids: list[str] = Query(default=[]),
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):  
    household_id  = current_user["ref_household_id"]
    return await recipe_crud_instance.search_with_pagination(
        db,household_id, name, max_making_time, ingredient_ids, offset, limit
    )

@router.get("/select", response_model=list[RecipeBase])
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def autocomplete_recipes(
    request: Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id  = current_user["ref_household_id"]
    return await recipe_crud_instance.select_search(db,household_id, name)


@router.get("/one", response_model=RecipeRead)
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def get_recipe(
    request : Request,
    recipe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id  = current_user["ref_household_id"]
    return await recipe_crud_instance.get_one(db,household_id, recipe_id)


@router.put("/update", response_model=RecipeRead)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def update_recipe(
    request : Request,
    data: RecipeUpdateData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id  = current_user["ref_household_id"]
    result = await recipe_crud_instance.update(db,household_id, data)
    await db.commit()
    return result


@router.post("/meals", response_model=MealCreateResponse)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_meal(
    request : Request,
    data: MealCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    result = await meal_crud_instance.create(db, data)
    await db.commit()
    return result

@router.get("/meals", response_model=MealSearchResult)
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def search_meals(
    request : Request,
    recipe_name: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await meal_crud_instance.search_with_pagination(
        db, recipe_name, start_date, end_date, offset, limit
    )
    
@router.get("/meals/initial-setup", response_model=list[MealIngredientRead])
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def search_meals(
    request : Request,
    recipe_id : str,
    nb_serving : int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id  = current_user["ref_household_id"]
    return await meal_crud_instance.get_meal_recipe_setup(db,household_id,recipe_id,nb_serving)

@router.put("/meals/delete", response_model=MealBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def delete_meal(
    request : Request,
    delete_data: DeleteMealData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    result = await meal_crud_instance.soft_delete(db, delete_data.meal_id)
    await db.commit()
    return result
