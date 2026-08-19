from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.shopping import Shopping
    from app.models.ingredient import Ingredient
    from app.models.item_category import ItemCategory

import uuid
from datetime import datetime, timezone

from sqlalchemy import DECIMAL, String, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "shopping_item"


class ShoppingItem(Base):
    __tablename__ = "shopping_item"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name : Mapped[str] = mapped_column(String(128), nullable=False)
    description : Mapped[str] = mapped_column(String(128), nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))
    units_bought: Mapped[Decimal] = mapped_column(DECIMAL(16, 2))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Foreign keys
    ref_ingredient_id: Mapped[str] = mapped_column(ForeignKey("ingredient.id"),nullable=True)
    ref_shopping_id: Mapped[str] = mapped_column(ForeignKey("shopping.id"))
    ref_item_category_id: Mapped[str] = mapped_column(ForeignKey("item_category.id"))
    
    # Relationships
    ingredient: Mapped["Ingredient"] = relationship(back_populates="shopping_items")
    shopping: Mapped["Shopping"] = relationship(back_populates="shopping_items")
    item_category: Mapped["ItemCategory"] = relationship(back_populates="shopping_items")
