from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.validator import reject_empty_string


class ItemCategoryData(BaseModel):
    name: str = Field(example="Nettoyage")
    code: str = Field(example="INGREDIENT")

    _reject_empty = field_validator("name")(reject_empty_string)


class ItemCategoryBase(ItemCategoryData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class ItemCategoryRead(ItemCategoryBase):
    pass
