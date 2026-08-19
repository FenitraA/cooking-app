from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.validator import reject_empty_string


class IngredientUnitData(BaseModel):
    name: str = Field(example="Gram")
    symbol: str = Field(example="g")
    multiplier_to_base: Decimal = Field(gt=0,example=1)
    ref_unit_group_id: str = Field(description="FK to unit_group.id")

    _reject_empty = field_validator("name","symbol")(reject_empty_string)


class IngredientUnitBase(IngredientUnitData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class IngredientUnitRead(IngredientUnitBase):
    pass
