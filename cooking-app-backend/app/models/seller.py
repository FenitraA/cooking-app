from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.models.ingredient_stock import IngredientStock

import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import String, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "seller"


class Seller(Base):
    __tablename__ = "seller"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)

    # Relationships
    ingredient_stocks: Mapped[List["IngredientStock"]] = relationship(
        back_populates="seller"
    )
