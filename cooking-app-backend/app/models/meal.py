from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.recipe import Recipe
    from app.models.meal_ingredient import MealIngredient

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "meal"


class Meal(Base):
    __tablename__ = "meal"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    nb_serving: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Foreign keys
    ref_recipe_id: Mapped[str] = mapped_column(
        ForeignKey("recipe.id"),
        nullable=False,
    )
    # Relationships
    recipe: Mapped["Recipe"] = relationship(back_populates="meals")
    meal_ingredients: Mapped[list["MealIngredient"]] = relationship(
        back_populates="meal"
    )
