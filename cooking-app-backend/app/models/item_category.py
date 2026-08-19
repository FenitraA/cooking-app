from typing import TYPE_CHECKING

from app.models.item_to_buy import ItemToBuy

if TYPE_CHECKING:
    from app.models.shopping_item import ShoppingItem

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "item_category"


class ItemCategory(Base):
    __tablename__ = "item_category"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name : Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    
    # internal and stable identifier 
    code : Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Relationships
    shopping_items: Mapped[list["ShoppingItem"]] = relationship(
        back_populates="item_category"
    )

    items_to_buy: Mapped[list["ItemToBuy"]] = relationship(
        back_populates="item_category"
    )