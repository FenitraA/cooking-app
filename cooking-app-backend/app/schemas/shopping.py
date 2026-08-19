from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.shopping_item import ShoppingItemBase, ShoppingItemData, ShoppingItemRead


class ShoppingData(BaseModel):
    shopping_date: datetime = Field(example="2024-07-01")
    description: str | None = Field(
        example="Shopping for groceries...",default=None
    )
    ref_household_id: str | None = Field(description="FK to household.id")
    
class ShoppingCreate(ShoppingData):
    shopping_items : list[ShoppingItemData]
    
class ShoppingCreateFromItemsToBuy(ShoppingData):
    item_to_buy_ids : list[str]

class ShoppingBase(ShoppingData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True

class ShoppingCreateResponse(BaseModel):
    shopping: ShoppingBase
    shopping_items: list[ShoppingItemBase]
    

class ShoppingRead(BaseModel):
    shopping : ShoppingBase
    shopping_items : list[ShoppingItemRead]
    total_cost : Decimal
    

class ShoppingSearchResult(BaseModel):
    items: list[ShoppingRead]
    total: int
    offset: int
    limit: int
    
class DeleteShoppingData(BaseModel):
    shopping_id : str