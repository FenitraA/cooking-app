from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator
from app.schemas.validator import reject_empty_string


class RecipeData(BaseModel):
    name: str = Field(example="Pumpkin soup", max_length=128)
    ref_household_id: str | None = Field(description="FK to household.id")
    description: str = Field(
        example="-Cut pumpkin, add salt and pepper, cook for 30min ..."
    )

    estimated_time: int = Field(ge=0, example=60)  # minutes
    # Number of servings that can be cooked in parallel
    parallel_cooking: int = Field(gt=0, example=2)

    image_url: str | None = Field(description="CDN URL your frontend uses")
    storage_key: str | None = Field(
        description="Cloudinary public_id OR S3/R2 object_key (super useful for deletes)"
    )

    _reject_empty = field_validator("name", "description")(reject_empty_string)


class RecipeImageData(BaseModel):
    id: str
    image_url: str = Field(description="CDN URL your frontend uses")
    storage_key: str = Field(
        description="Cloudinary public_id OR S3/R2 object_key (super useful for deletes)"
    )

    _reject_empty = field_validator("id")(reject_empty_string)


class RecipeIngredientBase(BaseModel):
    insertion_id: str | None = Field(description="Unique insertion id")
    ref_ingredient_id: str | None = Field(description="FK to ingredient.id")
    ref_recipe_id: str = Field(description="FK to recipe.id")
    quantity: Decimal = Field(
        gt=0, example=0.8
    )  # Quantity needed

    _reject_empty = field_validator("ref_ingredient_id")(reject_empty_string)

    class Config:
        from_attributes = True


class RecipeIngredientRead(BaseModel):
    recipe_ingredient_base: RecipeIngredientBase
    recipe_name: str
    ingredient_name: str
    ingredient_unit: str
    estimated_cost_per_unit: Decimal = 0.0


class RecipeCreate(RecipeData):
    recipe_ingredients: list[RecipeIngredientBase]


class RecipeBase(RecipeData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True


class RecipeCreateResponse(BaseModel):
    recipe: RecipeBase
    recipe_ingredients: list[RecipeIngredientBase]


class RecipeRead(BaseModel):
    recipe: RecipeBase
    estimated_cost_price: Decimal = 0.0
    recipe_ingredients: list[RecipeIngredientRead] = []


class RecipeSearchResult(BaseModel):
    items: list[RecipeRead]
    total: int
    offset: int
    limit: int


class RecipeUpdateData(BaseModel):
    """Schema used to update a Recipe."""

    id: str

    name: str | None = Field(default=None, max_length=128, example="Pumpkin soup")
    description: str | None = Field(
        default=None, example="-Cut pumpkin, add salt and pepper, cook for 30min ..."
    )
    estimated_time: int | None = Field(default=None, ge=0, example=60)
    parallel_cooking: int | None = Field(default=None, gt=0, example=2)

    recipe_ingredients: list[RecipeIngredientBase] | None = None

    _reject_empty = field_validator("id", "name", "description")(reject_empty_string)
