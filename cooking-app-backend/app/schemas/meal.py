from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator
from app.schemas.validator import reject_empty_string


class MealData(BaseModel):
    ref_recipe_id: str = Field(description="FK to recipe.id")
    nb_serving: int = Field(example=4)

    _reject_empty = field_validator("ref_recipe_id")(reject_empty_string)


class MealIngredientBase(BaseModel):
    ref_meal_id: str | None = Field(description="FK to meal.id")
    ref_ingredient_stock_id: str = Field(description="FK to ingredient_stock.id")
    ref_ingredient_unit_id: str | None = Field(description="FK to ingredient_unit.id")
    quantity: Decimal = Field(gt=0,example=0.8)
    
    _reject_empty = field_validator("ref_ingredient_stock_id")(reject_empty_string)
    
    class Config:
        from_attributes = True
    
class MealIngredientRead(BaseModel):
    meal_ingredient_base: MealIngredientBase
    seller_name: str
    ingredient_name: str
    ingredient_unit: str
    unit_cost: Decimal
    total_price: Decimal

class MealCreate(MealData):
    meal_ingredients: list[MealIngredientBase]


class MealBase(MealData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class MealCreateResponse(BaseModel):
    meal: MealBase
    meal_ingredients: list[MealIngredientBase]


class MealRead(BaseModel):
    meal: MealBase
    recipe_name: str | None = None
    total_cost_price: Decimal = 0.0
    meal_ingredients: list[MealIngredientRead] = []


class MealSearchResult(BaseModel):
    items: list[MealRead]
    total: int
    offset: int
    limit: int

class DeleteMealData(BaseModel):
    meal_id: str