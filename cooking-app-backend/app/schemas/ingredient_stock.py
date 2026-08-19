
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator
from app.schemas.validator import reject_empty_string

class IngredientStockData(BaseModel):
    unit_cost: Decimal = Field(gt=0,example=20000) # Ariary
    quantity: Decimal = Field(gt=0,example=1.5)
    ref_seller_id: str = Field(description="FK to seller.id")
    ref_ingredient_id: str = Field(description="FK to ingredient.id")
    ref_household_id: str | None = Field(description="FK to household.id")
   
    _reject_empty = field_validator("ref_seller_id","ref_ingredient_id")(
        reject_empty_string
    )
   
class IngredientStockBase(IngredientStockData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int
    
    class Config:
        from_attributes = True
        
class IngredientStockRead(BaseModel):
    ingredient_stock: IngredientStockBase
    ingredient_name: str
    ingredient_unit: str
    seller_name: str
    quantity_left: Decimal = 0.0
    
class DeleteIngredientStockData(BaseModel):
    ingredient_stock_id: str