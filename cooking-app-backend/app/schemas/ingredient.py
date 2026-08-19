from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator
from app.schemas.ingredient_type import IngredientTypeBase
from app.schemas.ingredient_unit import IngredientUnitBase
from app.schemas.validator import reject_empty_string


class IngredientData(BaseModel):
    name: str = Field(example="Tomato", max_length=128)
    unit: str | None = Field(
        default=None,
        description="Used for selection that needs the unit without complexifying the query",
    )
    ref_ingredient_unit_id: str = Field(description="FK to ingredient_unit.id")
    ref_ingredient_type_id: str = Field(description="FK to ingredient_type.id")

    # Ariary
    estimated_price: Decimal = Field(gt=0, example=20000)
    image_url: str | None = Field(description="CDN URL your frontend uses")
    storage_key: str | None = Field(
        description="Cloudinary public_id OR S3/R2 object_key (super useful for deletes)"
    )

    _reject_empty = field_validator("name", "ref_ingredient_type_id")(
        reject_empty_string
    )


class IngredientBase(IngredientData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class IngredientImageData(BaseModel):
    id: str
    image_url: str = Field(description="CDN URL your frontend uses")
    storage_key: str = Field(
        description="Cloudinary public_id OR S3/R2 object_key (super useful for deletes)"
    )

    _reject_empty = field_validator("id", "image_url", "storage_key")(
        reject_empty_string
    )


class IngredientRead(BaseModel):
    ingredient: IngredientBase
    ingredient_unit: IngredientUnitBase
    ingredient_type: IngredientTypeBase
    quantity_left: Decimal = 0.0
    group_name : str


class IngredientSearchResult(BaseModel):
    items: list[IngredientRead]
    total: int
    offset: int
    limit: int


class IngredientUpdateData(BaseModel):
    """Schema used to update an Ingredient."""

    id: str

    name: str | None = Field(default=None, max_length=128)
    ref_ingredient_unit_id: str | None = Field(
        default=None, description="FK to ingredient_unit.id"
    )
    ref_ingredient_type_id: str | None = Field(
        default=None, description="FK to ingredient_type.id"
    )
    estimated_price: Decimal | None = Field(default=None, gt=0, example=20000)

    _reject_empty = field_validator(
        "name", "ref_ingredient_unit_id", "ref_ingredient_type_id"
    )(reject_empty_string)
