from fastapi import APIRouter, Depends, Request
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.cache_utils import household_aware_key_builder
from app.core.security import require_roles
from app.core.security import limiter
from app.core.config import settings
from app.db.database import get_db
from app.schemas.item_category import (
    ItemCategoryBase,
    ItemCategoryData,
    ItemCategoryRead,
)

from app.crud.item_category_crud import item_category_crud_instance

router = APIRouter(tags=["ItemCategories"])


@router.post("", response_model=ItemCategoryBase)
@limiter.limit("5/minute")
# @handle_endpoint_errors()
async def create_item_to_buy(
    request: Request,
    data: ItemCategoryData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION)),
):
    result = await item_category_crud_instance.create(db, data)
    await db.commit()
    await FastAPICache.clear(namespace="item_categories:list")
    await FastAPICache.clear(namespace="item_categories:ingredient")
    return result


@router.get("", response_model=list[ItemCategoryBase])
@limiter.limit("20/minute")
@cache(expire=60 * 60, namespace="item_categories:list", key_builder=household_aware_key_builder)
# @handle_endpoint_errors()
async def select_search_category(
    request: Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await item_category_crud_instance.select_search(db, name)


@router.get("/ingredient", response_model=ItemCategoryRead)
@limiter.limit("20/minute")
@cache(expire=60 * 60, namespace="item_categories:ingredient", key_builder=household_aware_key_builder)
# @handle_endpoint_errors()
async def select_search_category(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    return await item_category_crud_instance.get_ingredient_category(db)
