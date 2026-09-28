from fastapi import APIRouter, Depends, Request
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.cache_utils import household_aware_key_builder
from app.core.security import require_roles
from app.core.security import limiter
from app.core.config import settings
from app.crud.item_to_buy_crud import item_to_buy_crud_instance
from app.db.database import get_db
from app.schemas.item_to_buy import (
    DeleteItemToBuyData,
    ItemToBuyBase,
    ItemToBuyData,
    ItemToBuyRead,
    ItemToBuySearchResult,
    ItemToBuyUpdateData,
)

router = APIRouter(tags=["ItemsToBuy"])


@router.post("", response_model=ItemToBuyBase)
@limiter.limit("5/minute")
#@handle_endpoint_errors()
async def create_item_to_buy(
    request: Request,
    data: ItemToBuyData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    data.ref_household_id = current_user["ref_household_id"]
    result = await item_to_buy_crud_instance.create(db, data)
    await db.commit()
    await FastAPICache.clear(namespace="items_to_buy:list")
    return result


@router.get("", response_model=ItemToBuySearchResult)
@limiter.limit("10/minute")
@cache(expire=60 * 5, namespace="items_to_buy:list", key_builder=household_aware_key_builder)
#@handle_endpoint_errors()
async def search_items_to_buy(
    request: Request,
    name: str | None = None,
    ingredient_id: str | None = None,
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    return await item_to_buy_crud_instance.search_with_pagination(
        db, household_id, name, ingredient_id, offset, limit
    )


@router.patch("/delete", response_model=ItemToBuyBase)
@limiter.limit("20/minute")
#@handle_endpoint_errors()
async def delete_item_to_buy(
    request: Request,
    delete_data: DeleteItemToBuyData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    result = await item_to_buy_crud_instance.soft_delete(
        db, household_id, delete_data.item_to_buy_id
    )
    await db.commit()
    await FastAPICache.clear(namespace="items_to_buy:list")
    return result


@router.patch("/update", response_model=ItemToBuyRead)
@limiter.limit("5/minute")
#@handle_endpoint_errors()
async def update_ingredient(
    request: Request,
    data: ItemToBuyUpdateData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    result = await item_to_buy_crud_instance.update(db, data)
    await db.commit()
    await FastAPICache.clear(namespace="items_to_buy:list")
    return result
