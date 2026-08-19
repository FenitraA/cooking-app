from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.household import Household
    from app.models.shopping_item import ShoppingItem

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "shopping"


class Shopping(Base):
    __tablename__ = "shopping"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    shopping_date: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    description : Mapped[str] = mapped_column(String(128), nullable=True)
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
    
    # Relationships
    household: Mapped["Household"] = relationship(back_populates="shoppings")
    shopping_items: Mapped[list["ShoppingItem"]] = relationship(
        back_populates="shopping"
    )
