from datetime import date, datetime
from decimal import Decimal


from pydantic import BaseModel, Field, field_validator
from app.schemas.recipe import RecipeBase, RecipeIngredientRead
from app.schemas.validator import reject_empty_string


class PlanningRecipeData(BaseModel):
    ref_recipe_id: str = Field(description="FK to recipe.id")
    ref_household_id: str | None = Field(description="FK to household.id")
    planning_date: date | None = Field(example="2024-07-01")
    nb_serving: int = Field(gt=0, example="2")
    description: str | None = Field(default=None, description="Notes for the planning")

    _reject_empty = field_validator("ref_recipe_id")(reject_empty_string)

class PlanningRecipeCreate(PlanningRecipeData):
    planning_dates: list[date] = Field(example="2024-07-01,2024-07-02... ")

class PlanningRecipeBase(PlanningRecipeData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class PlanningRecipeRead(BaseModel):
    planning_recipe: PlanningRecipeBase
    recipe: RecipeBase
    is_done: bool
    estimated_cost_price: Decimal
    recipe_ingredients: list[RecipeIngredientRead]


class PlanningRepartition(BaseModel):
    planning_group_date: date
    day_name: str
    planning_recipes: list[PlanningRecipeRead]
    estimated_cost_price : Decimal

class PlanningResult(BaseModel):
    planning_repartitions: list[PlanningRepartition]
    total_estimated_cost_price: Decimal
    ingredients_to_buy: list[RecipeIngredientRead]

class DeletePlanningData(BaseModel):
    planning_recipe_id: str


class PlanningRecipeUpdateData(BaseModel):
    """Schema used to update a Planning recipe."""

    id: str

    ref_recipe_id: str | None = Field(description="FK to recipe.id", default=None)
    planning_date: date | None = Field(example="2024-07-01", default=None)
    nb_serving: int | None = Field(gt=0, example="2", default=None)
    description: str | None = Field(default=None, description="Notes for the planning")

    _reject_empty = field_validator(
        "ref_recipe_id"
    )(reject_empty_string)
