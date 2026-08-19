from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.meal import Meal
    from app.models.ingredient_stock import IngredientStock

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import ForeignKey, DECIMAL, TIMESTAMP, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class MealIngredient(Base):
    __tablename__ = "meal_ingredient"

    quantity: Mapped[Decimal] = mapped_column(DECIMAL(16, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1, nullable=False)

    # Foreign keys
    ref_ingredient_unit_id: Mapped[str] = mapped_column(
        ForeignKey("ingredient_unit.id"),nullable=True
    )
    ref_meal_id: Mapped[str] = mapped_column(ForeignKey("meal.id"), primary_key=True)

    ref_ingredient_stock_id: Mapped[str] = mapped_column(
        ForeignKey("ingredient_stock.id"), primary_key=True
    )

    # Relationships
    meal: Mapped["Meal"] = relationship(back_populates="meal_ingredients")
    ingredient_stock: Mapped["IngredientStock"] = relationship(
        back_populates="meal_ingredients"
    )
