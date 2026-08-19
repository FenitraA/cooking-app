from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.household import Household
    from app.models.recipe import Recipe

from datetime import date, datetime, timezone

from sqlalchemy import Date, ForeignKey, TIMESTAMP, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


prefix = "planning_recipe"

class PlanningRecipe(Base):
    __tablename__ = "planning_recipe"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )
    nb_serving : Mapped[int] = mapped_column(Integer)
    planning_date: Mapped[date] = mapped_column(Date)
    description: Mapped[str] = mapped_column(Text,nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Foreign Keys
    ref_household_id: Mapped[str] = mapped_column(
        ForeignKey("household.id"),
        nullable=False,
    )

    ref_recipe_id: Mapped[str] = mapped_column(
        ForeignKey("recipe.id"),
        nullable=False,
    )

    # relationships
    household: Mapped["Household"] = relationship(back_populates="planning_recipes")
    recipe: Mapped["Recipe"] = relationship(back_populates="planning_recipes")
