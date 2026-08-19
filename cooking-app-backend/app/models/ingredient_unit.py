from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ingredient import Ingredient
    from app.models.unit_group import UnitGroup
    
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List

from sqlalchemy import ForeignKey, String, DECIMAL, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "ingredient_unit"


class IngredientUnit(Base):
    __tablename__ = "ingredient_unit"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    symbol: Mapped[str] = mapped_column(String(8), nullable=False)
    multiplier_to_base: Mapped[Decimal] = mapped_column(DECIMAL(18, 6), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(default=1)
    
    # Foreign keys
    ref_unit_group_id: Mapped[str] = mapped_column(
        ForeignKey("unit_group.id"),
        nullable=False,
    )
    # Relationships
    unit_group: Mapped["UnitGroup"] = relationship(
        back_populates="ingredient_units"
    )
    ingredients: Mapped[list["Ingredient"]] = relationship(
        back_populates="ingredient_unit"
    )
