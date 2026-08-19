from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ingredient_stock import IngredientStock
    from app.models.planning_recipe import PlanningRecipe
    from app.models.recipe import Recipe
    from app.models.app_user import AppUser
    from app.models.shopping import Shopping
    from app.models.item_to_buy import ItemToBuy

import uuid

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import TIMESTAMP, Integer, String
from datetime import datetime, timezone
from app.db.database import Base

prefix = "household"


class Household(Base):
    __tablename__ = "household"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    planning_recipes: Mapped[list["PlanningRecipe"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
    ingredient_stocks: Mapped[list["IngredientStock"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
    items_to_buy: Mapped[list["ItemToBuy"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
    shoppings: Mapped[list["Shopping"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
    recipes: Mapped[list["Recipe"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
    app_users: Mapped[list["AppUser"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
