from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.schemas.validator import reject_empty_string


class IngredientTypeData(BaseModel):
    name: str = Field(example="Fruit",min_length=2)

    _reject_empty = field_validator("name")(reject_empty_string)


class IngredientTypeBase(IngredientTypeData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class IngredientTypeRead(IngredientTypeBase):
    pass
