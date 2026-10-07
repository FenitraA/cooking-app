
from datetime import date

from fastapi import APIRouter, Depends, Request
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.decorators import handle_endpoint_errors
from app.api.v1.cache_utils import household_aware_key_builder
from app.core.security import require_roles
from app.core.security import limiter
from app.core.config import settings
from app.crud.shopping_crud import shopping_item_crud_instance
from app.db.database import get_db
from app.schemas.shopping_item import DeleteShoppingItemData, ShoppingItemBase, ShoppingItemSearchResult


router = APIRouter(tags=["ShoppingItems"])

@router.get("", response_model=ShoppingItemSearchResult)
@limiter.limit("30/minute")
@cache(expire=60 * 5, namespace="shopping_items:list", key_builder=household_aware_key_builder)
#@handle_endpoint_errors()
async def search_shopping_items(
    request : Request,
    name: str | None = None,
    ingredient_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):  
    return await shopping_item_crud_instance.search_with_pagination(
        db, name,ingredient_id,start_date,end_date, offset, limit
    )
    
@router.patch("/delete", response_model=ShoppingItemBase)
@limiter.limit("5/minute")
#@handle_endpoint_errors()
async def delete_shopping_item(
    request: Request,
    delete_data: DeleteShoppingItemData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    result = await shopping_item_crud_instance.soft_delete(
        db, delete_data.shopping_item_id
    )
    await db.commit()
    await FastAPICache.clear(namespace="shopping_items:list")
    return result