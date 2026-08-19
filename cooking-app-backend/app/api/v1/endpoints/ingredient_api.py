import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, Request, status
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.decorators import handle_endpoint_errors
from app.core.security import require_roles
from app.core.security import limiter
from app.crud.seller_crud import seller_crud_instance
from app.crud.ingredient_crud import ingredient_crud_instance
from app.crud.ingredient_stock_crud import ingredient_stock_crud_instance
from app.db.database import get_db
from app.schemas.ingredient import (
    IngredientBase,
    IngredientData,
    IngredientImageData,
    IngredientRead,
    IngredientSearchResult,
    IngredientUpdateData,
)
from app.schemas.ingredient_stock import (
    DeleteIngredientStockData,
    IngredientStockBase,
    IngredientStockData,
    IngredientStockRead,
)
from app.schemas.ingredient_type import IngredientTypeRead
from app.schemas.ingredient_unit import IngredientUnitRead
from app.schemas.seller import SellerRead
from app.core.config import settings
from app.services.general_service import get_cloudinary_config

router = APIRouter(tags=["Ingredients"])


@router.post("", response_model=IngredientBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_ingredient(
    request: Request,
    data: IngredientData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.INGREDIENT_MANAGER_ROLE_DENOMINATION)),
):
    result = await ingredient_crud_instance.create(db, data)
    await db.commit()
    return result


@router.put("/image", response_model=IngredientRead)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def set_ingredient_image(
    request: Request,
    data: IngredientImageData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.INGREDIENT_MANAGER_ROLE_DENOMINATION)),
):
    old_ingredient = await ingredient_crud_instance.get_one(db, data.id)

    if not old_ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found"
        )

    old_storage_key = old_ingredient.ingredient.storage_key

    result = await ingredient_crud_instance.set_image(db, data)

    await db.commit()

    # Delete older image from Cloudinary if exists
    if old_storage_key:
        res = await asyncio.to_thread(
            cloudinary.uploader.destroy, old_storage_key, invalidate=True
        )
    # Change image
    return result


@router.get("", response_model=IngredientSearchResult)
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def list_ingredients(
    request: Request,
    name: str | None = None,
    type_id: str | None = None,
    sort_by: str | None = None,
    sort_direction: str | None = None,
    min_stock: float | None = None,
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await ingredient_crud_instance.search_with_pagination(
        db, name, type_id, min_stock, sort_by, sort_direction, offset, limit
    )


@router.get("/types", response_model=list[IngredientTypeRead])
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def list_types(
    request: Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await ingredient_crud_instance.select_type_search(db, name)


@router.get("/units", response_model=list[IngredientUnitRead])
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def list_units(
    request: Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await ingredient_crud_instance.select_unit_search(db, name)


@router.get("/one", response_model=IngredientRead)
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def get_ingredient(
    request: Request,
    ingredient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await ingredient_crud_instance.get_one(db, ingredient_id)


@router.put("/update", response_model=IngredientRead)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def update_ingredient(
    request: Request,
    data: IngredientUpdateData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.INGREDIENT_MANAGER_ROLE_DENOMINATION)),
):
    result = await ingredient_crud_instance.update(db, data)
    await db.commit()
    return result


### Stock


@router.get("/stocks", response_model=list[IngredientStockRead])
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def get_stock(
    request: Request,
    ingredient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    return await ingredient_stock_crud_instance.get_stocks_by_ingredient(
        db, household_id, ingredient_id
    )


@router.post("/stocks", response_model=IngredientStockBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_stock(
    request: Request,
    data: IngredientStockData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    data.ref_household_id = current_user["ref_household_id"]
    result = await ingredient_stock_crud_instance.create(db, data)
    await db.commit()
    return result


@router.put("/stocks/delete", response_model=IngredientStockBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def delete_stock(
    request: Request,
    delete_data: DeleteIngredientStockData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    result = await ingredient_stock_crud_instance.soft_delete(
        db, household_id, delete_data.ingredient_stock_id
    )
    await db.commit()
    return result


### Sellers


@router.get("/sellers", response_model=list[SellerRead])
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def list_sellers(
    request: Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await seller_crud_instance.select_search(db, name)


@router.get("/select", response_model=list[IngredientBase])
@limiter.limit("20/minute")
@handle_endpoint_errors()
async def autocomplete_ingredients(
    request: Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await ingredient_crud_instance.select_search(db, name)
