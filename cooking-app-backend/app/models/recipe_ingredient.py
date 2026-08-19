from typing import TYPE_CHECKING
import uuid


if TYPE_CHECKING:
    from app.models.ingredient import Ingredient
    from app.models.recipe import Recipe

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import ForeignKey, DECIMAL, TIMESTAMP, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredient"
    
    quantity: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    insertion_id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    
    # Foreign Keys
    ref_recipe_id: Mapped[str] = mapped_column(
        ForeignKey("recipe.id"),
        primary_key=True,
    )

    ref_ingredient_id: Mapped[str] = mapped_column(
        ForeignKey("ingredient.id"),
        primary_key=True,
    )
    # Relationships
    recipe: Mapped["Recipe"] = relationship(back_populates="recipe_ingredients")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="recipe_ingredients")
    
    @staticmethod
    def generate_insertion_id():
        """Generate a prefixed UUID string ID"""
        return f"{uuid.uuid4()}"