from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ingredient import Ingredient
    
import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import String, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

prefix = "ingredient_type"


class IngredientType(Base):
    __tablename__ = "ingredient_type"

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

    state: Mapped[int] = mapped_column(default=1, nullable=False)

    # relationships
    ingredients: Mapped[List["Ingredient"]] = relationship(
        back_populates="ingredient_type", cascade="all, delete-orphan"
    )
