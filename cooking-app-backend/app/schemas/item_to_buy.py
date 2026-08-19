from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.ingredient import IngredientBase
from app.schemas.item_category import ItemCategoryBase
from app.schemas.validator import reject_empty_string


class ItemToBuyData(BaseModel):
    name: str = Field(example="Tomato", max_length=128)
    description: str | None = Field(example="Shopping for groceries...", default=None)
    estimated_unit_price: Decimal = Field(gt=0, example=20000)
    units_to_buy: Decimal = Field(gt=0, example=2)
    ref_ingredient_id: str | None = Field(description="FK to shopping_item.id")
    ref_shopping_item_id: str | None = Field(description="FK to shopping_item.id")
    ref_item_category_id: str = Field(description="FK to item_category.id")
    ref_household_id: str | None = Field(description="FK to household.id")

    _reject_empty = field_validator("ref_ingredient_id", "ref_item_category_id", "name")(
        reject_empty_string
    )


class ItemToBuyBase(ItemToBuyData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class ItemToBuyRead(BaseModel):
    item_to_buy: ItemToBuyBase
    item_category: ItemCategoryBase
    ingredient_infos: IngredientBase | None


class ItemToBuySearchResult(BaseModel):
    items: list[ItemToBuyRead]
    total: int
    offset: int
    limit: int
    
class ChangeStateToBoughtData(BaseModel):
    item_to_buy_id : str
    shopping_item_id: str
    
class DeleteItemToBuyData(BaseModel):
    item_to_buy_id : str
    
class ItemToBuyUpdateData(BaseModel):
    """Schema used to update an item to buy."""

    id: str

    estimated_unit_price: Decimal | None  = Field(gt=0, example=20000)
    units_to_buy: Decimal | None  = Field(gt=0, example=2)