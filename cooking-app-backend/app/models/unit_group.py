from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ingredient_unit import IngredientUnit
    
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List

from sqlalchemy import String, DECIMAL, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "unit_group"


class UnitGroup(Base):
    __tablename__ = "unit_group"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    symbol: Mapped[str] = mapped_column(String(8), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)
    
    # Relationships
    ingredient_units: Mapped[list["IngredientUnit"]] = relationship(
        back_populates="unit_group"
    )
