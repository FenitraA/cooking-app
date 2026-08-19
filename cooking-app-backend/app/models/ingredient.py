from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.models.item_to_buy import ItemToBuy
    from app.models.shopping_item import ShoppingItem
    from app.models.ingredient_unit import IngredientUnit
    from app.models.ingredient_type import IngredientType
    from app.models.ingredient_stock import IngredientStock
    from app.models.recipe_ingredient import RecipeIngredient
    
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List

from sqlalchemy import String, DECIMAL, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "ingredient"


class Ingredient(Base):
    __tablename__ = "ingredient"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)

    estimated_price: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)
    
    # CDN URL your frontend uses
    image_url: Mapped[str] = mapped_column(String(2048), nullable=True)

    # Cloudinary public_id OR S3/R2 object_key (super useful for deletes)
    storage_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Foreign keys
    ref_ingredient_type_id: Mapped[str] = mapped_column(
        ForeignKey("ingredient_type.id"),
        nullable=False,
    )
    ref_ingredient_unit_id: Mapped[str] = mapped_column(
        ForeignKey("ingredient_unit.id"),
        nullable=True,
    )
    # Relationships
    ingredient_type: Mapped["IngredientType"] = relationship(
        back_populates="ingredients"
    )
    ingredient_unit: Mapped["IngredientUnit"] = relationship(
        back_populates="ingredients"
    )

    items_to_buy: Mapped[List["ItemToBuy"]] = relationship(
        back_populates="ingredient",
        cascade="all, delete-orphan",
    )
    ingredient_stocks: Mapped[List["IngredientStock"]] = relationship(
        back_populates="ingredient",
        cascade="all, delete-orphan",
    )
    shopping_items: Mapped[List["ShoppingItem"]] = relationship(
        back_populates="ingredient",
        cascade="all, delete-orphan",
    )


    recipe_ingredients: Mapped[List["RecipeIngredient"]] = relationship(
        back_populates="ingredient"
    )
