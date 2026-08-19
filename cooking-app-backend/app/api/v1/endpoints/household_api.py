
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.decorators import handle_endpoint_errors
from app.core.security import require_roles
from app.core.security import limiter
from app.core.config import settings
from app.crud.household_crud import household_crud_instance
from app.db.database import get_db
from app.schemas.household import HouseholdBase, HouseholdData


router = APIRouter(tags=["Households"])

@router.post("", response_model=HouseholdBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def create_household(
    request : Request,
    data: HouseholdData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION))
    
):
    result = await household_crud_instance.create(db, data)
    await db.commit()
    return result

@router.get("/select", response_model=list[HouseholdBase])
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def autocomplete_ingredients(
    request : Request,
    name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.ADMIN_ROLE_DENOMINATION))
):
    return await household_crud_instance.select_search(db, name)