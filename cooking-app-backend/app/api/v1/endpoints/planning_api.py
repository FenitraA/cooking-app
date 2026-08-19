from datetime import date, timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.decorators import handle_endpoint_errors
from app.core.security import require_roles
from app.core.security import limiter
from app.crud.planning_crud import planning_crud_instance
from app.db.database import get_db
from app.schemas.planning_recipe import (
    DeletePlanningData,
    PlanningRecipeBase,
    PlanningRecipeCreate,
    PlanningRecipeData,
    PlanningRecipeRead,
    PlanningRecipeUpdateData,
    PlanningRepartition,
    PlanningResult,
)
from app.services.planning_service import (
    get_total_estimated_price_from_repartitions,
    get_total_ingredients_to_buy,
    redistribute_to_repartition,
)
from app.core.config import settings

router = APIRouter(tags=["Planning"])


@router.post("", response_model=list[PlanningRecipeBase])
@limiter.limit("5/minute")
# @handle_endpoint_errors()
async def create_planning_recipe(
    request: Request,
    data: PlanningRecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    data.ref_household_id = current_user["ref_household_id"]
    result = await planning_crud_instance.create_many(db, data)
    await db.commit()
    return result


@router.get("/weekly", response_model=PlanningResult)
@limiter.limit("30/minute")
@handle_endpoint_errors()
async def get_planning_weekly(
    request: Request,
    planning_date: date,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    start_of_week = planning_date - timedelta(days=planning_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    plannings = await planning_crud_instance.get_by_date(
        db, household_id, start_of_week, end_of_week
    )
    planning_repartitions = redistribute_to_repartition(
        start_of_week, end_of_week, plannings
    )
    return PlanningResult(
        planning_repartitions=planning_repartitions,
        total_estimated_cost_price=get_total_estimated_price_from_repartitions(
            planning_repartitions
        ),
        ingredients_to_buy=get_total_ingredients_to_buy(planning_repartitions),
    )


@router.get("", response_model=PlanningResult)
@limiter.limit("30/minute")
@handle_endpoint_errors()
async def get_planning(
    request: Request,
    today_date: date,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    start_date = today_date - timedelta(days=today_date.weekday())
    end_date = start_date + timedelta(days=days - 1)

    plannings = await planning_crud_instance.get_by_date(
        db,
        household_id,
        start_date,
        end_date,
    )

    planning_repartitions = redistribute_to_repartition(
        start_date,
        end_date,
        plannings,
    )
    return PlanningResult(
        planning_repartitions=planning_repartitions,
        total_estimated_cost_price=get_total_estimated_price_from_repartitions(
            planning_repartitions
        ),
        ingredients_to_buy=get_total_ingredients_to_buy(planning_repartitions),
    )


@router.get("/one", response_model=PlanningRecipeRead)
@limiter.limit("10/minute")
@handle_endpoint_errors()
async def get_planning_recipe(
    request: Request,
    planning_recipe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    return await planning_crud_instance.get_one(db, household_id, planning_recipe_id)


@router.put("/delete", response_model=PlanningRecipeBase)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def delete_stock(
    request: Request,
    delete_data: DeletePlanningData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    result = await planning_crud_instance.soft_delete(
        db, household_id, delete_data.planning_recipe_id
    )
    await db.commit()
    return result


@router.put("/update", response_model=PlanningRecipeRead)
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def update_planning_recipe(
    request: Request,
    data: PlanningRecipeUpdateData,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.BASIC_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    result = await planning_crud_instance.update(db, household_id, data)
    await db.commit()
    return result


@router.get("/print/")
@limiter.limit("5/minute")
@handle_endpoint_errors()
async def print_planning(
    request: Request,
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION)),
):
    household_id = current_user["ref_household_id"]
    pdf_buffer = await planning_crud_instance.generate_pdf(
        db, household_id, start_date, end_date
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=planning.pdf"},
    )
