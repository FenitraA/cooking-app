from datetime import date

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.decorators import handle_endpoint_errors
from app.core.security import require_roles
from app.core.security import limiter
from app.core.config import settings
from app.crud.shopping_crud import shopping_crud_instance
from app.db.database import get_db
from app.schemas.shopping import (
    DeleteShoppingData,
    ShoppingBase,
    ShoppingCreate,
    ShoppingCreateFromItemsToBuy,
    ShoppingCreateResponse,
    ShoppingSearchResult,
)

router = APIRouter(tags=["Shoppings"])


@router.post("", response_model=ShoppingCreateResponse)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_shopping(
    request: Request,
    data: ShoppingCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    data.ref_household_id = current_user["ref_household_id"]
    result = await shopping_crud_instance.create(db, data)
    await db.commit()
    return result


@router.post("/from-items-to-buy", response_model=ShoppingCreateResponse)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_shopping_from_items_to_buy(
    request: Request,
    data: ShoppingCreateFromItemsToBuy,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    data.ref_household_id = current_user["ref_household_id"]
    result = await shopping_crud_instance.create_from_items_to_buy(db, data)
    await db.commit()
    return result


@router.get("", response_model=ShoppingSearchResult)
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def search_shoppings(
    request: Request,
    start_date: date | None = None,
    end_date: date | None = None,
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):

    if start_date is not None and end_date is not None and start_date > end_date:
        start_date, end_date = end_date, start_date
    household_id = current_user["ref_household_id"]
    return await shopping_crud_instance.search_with_pagination(
        db, household_id, start_date, end_date, offset, limit
    )


@router.put("/delete", response_model=ShoppingBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def delete_shopping(
    request: Request,
    delete_data: DeleteShoppingData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    result = await shopping_crud_instance.soft_delete(
        db, household_id, delete_data.shopping_id
    )
    await db.commit()
    return result
