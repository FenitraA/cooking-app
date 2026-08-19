from typing import TYPE_CHECKING,List



if TYPE_CHECKING:
    from app.models.user_role import UserRole
    from app.models.refresh_token import RefreshToken
    from app.models.household import Household
    
import uuid

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import TIMESTAMP, ForeignKey, Integer, String, func, Text, select
from datetime import datetime, timezone
from app.db.database import Base

prefix = "app_user"


class AppUser(Base):
    __tablename__ = "app_user"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    default_language: Mapped[str] = mapped_column(String(3), nullable=True)
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # foreign keys
    ref_household_id: Mapped[str] = mapped_column(ForeignKey("household.id"))
    
    #Relationships
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(back_populates="user")  
    user_roles: Mapped[List["UserRole"]] = relationship(back_populates="user")
    household: Mapped["Household"] = relationship(back_populates="app_users")
    
