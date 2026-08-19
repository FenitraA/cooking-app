from decimal import Decimal
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.models.household import Household
    from app.models.shopping import Shopping
    from app.models.ingredient import Ingredient
    from app.models.item_category import ItemCategory

import uuid
from datetime import datetime, timezone

from sqlalchemy import DECIMAL, String, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "item_to_buy"


class ItemToBuy(Base):
    __tablename__ = "item_to_buy"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name : Mapped[str] = mapped_column(String(128), nullable=False)
    description : Mapped[str] = mapped_column(String(128), nullable=True)
    estimated_unit_price: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))
    units_to_buy: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Foreign keys
    ref_household_id: Mapped[str] = mapped_column(ForeignKey("household.id"))
    ref_ingredient_id: Mapped[str] = mapped_column(ForeignKey("ingredient.id"),nullable=True)
    ref_shopping_item_id: Mapped[str] = mapped_column(ForeignKey("shopping_item.id"),nullable=True)
    ref_item_category_id: Mapped[str] = mapped_column(ForeignKey("item_category.id"))
    
    # Relationships
    household: Mapped["Household"] = relationship(back_populates="items_to_buy")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="items_to_buy")
    item_category: Mapped["ItemCategory"] = relationship(back_populates="items_to_buy")
