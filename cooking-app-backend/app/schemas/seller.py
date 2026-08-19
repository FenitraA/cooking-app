from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.validator import reject_empty_string


class SellerData(BaseModel):
    name: str = Field(example="Bazar be", max_length=128)

    _reject_empty = field_validator("name")(
        reject_empty_string
    )


class SellerBase(SellerData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class SellerRead(SellerBase):
    pass
