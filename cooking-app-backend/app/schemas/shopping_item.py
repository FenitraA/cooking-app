from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.ingredient import IngredientBase
from app.schemas.item_category import ItemCategoryBase
from app.schemas.validator import reject_empty_string


class ShoppingItemData(BaseModel):
    name: str = Field(example="Tomato", max_length=128)
    description: str | None = Field(
        example="Shopping for groceries...",default=None
    )
    unit_price: Decimal = Field(gt=0, example=20000)
    units_bought: Decimal = Field(gt=0, example=2)
    ref_ingredient_id: str | None = Field(description="FK to shopping_item.id")
    ref_shopping_id : str = Field(description="FK to shopping.id")
    ref_item_category_id : str = Field(description="FK to item_category.id")
    
    _reject_empty = field_validator("ref_item_category_id","name")(
        reject_empty_string
    )

class ShoppingItemBase(ShoppingItemData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True

class ShoppingItemRead(BaseModel):
    shopping_item : ShoppingItemBase
    item_category : ItemCategoryBase
    ingredient_infos : IngredientBase | None
    shopping_date: datetime

class ShoppingItemSearchResult(BaseModel):
    items: list[ShoppingItemRead]
    total: int
    offset: int
    limit: int

class DeleteShoppingItemData(BaseModel):
    shopping_item_id : str
