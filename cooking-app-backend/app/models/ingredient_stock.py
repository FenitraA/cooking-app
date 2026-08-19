from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.models.household import Household
    from app.models.ingredient import Ingredient
    from app.models.seller import Seller
    from app.models.meal_ingredient import MealIngredient

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import String, DECIMAL, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "stock"


class IngredientStock(Base):
    __tablename__ = "ingredient_stock"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    unit_cost: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))
    quantity: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Foreign keys
    ref_ingredient_id: Mapped[str] = mapped_column(
        ForeignKey("ingredient.id"),
        nullable=False,
    )

    ref_seller_id: Mapped[str] = mapped_column(
        ForeignKey("seller.id"),
        nullable=False,
    )
    ref_household_id: Mapped[str] = mapped_column(ForeignKey("household.id"))
    
    # Relationships
    household: Mapped["Household"] = relationship(back_populates="ingredient_stocks")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="ingredient_stocks")
    seller: Mapped["Seller"] = relationship(back_populates="ingredient_stocks")
    meal_ingredients: Mapped[list["MealIngredient"]] = relationship(
        back_populates="ingredient_stock"
    )
