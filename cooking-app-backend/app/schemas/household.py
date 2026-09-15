
from datetime import datetime

from pydantic import BaseModel, Field, field_validator
from app.schemas.validator import reject_empty_string


class HouseholdData(BaseModel):
    name: str = Field(example="Rajaonarison", max_length=128,min_length=2)

    _reject_empty = field_validator("name")(
        reject_empty_string
    )


class HouseholdBase(HouseholdData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True

