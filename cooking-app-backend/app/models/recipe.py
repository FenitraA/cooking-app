from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.recipe_ingredient import RecipeIngredient
    from app.models.planning_recipe import PlanningRecipe
    from app.models.household import Household
    from app.models.meal import Meal

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, TIMESTAMP, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "recipe"


class Recipe(Base):
    __tablename__ = "recipe"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name: Mapped[str] = mapped_column(String(128), unique=True)
    description: Mapped[str] = mapped_column(Text)
    estimated_time: Mapped[int] = mapped_column(Integer)
    parallel_cooking: Mapped[int] = mapped_column(Integer)
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
    
    # foreign keys
    ref_household_id: Mapped[str] = mapped_column(ForeignKey("household.id"))

    # Relationships
    household: Mapped["Household"] = relationship(back_populates="recipes")
    recipe_ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
    planning_recipes: Mapped[list["PlanningRecipe"]] = relationship(
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
    meals: Mapped[list["Meal"]] = relationship(
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
