from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.app_user import AppUser

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import TIMESTAMP, Integer, String
from datetime import datetime, timezone
from app.db.database import Base


class UserRole(Base):
    __tablename__ = "user_role"

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Foreign Keys
    ref_role_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("role.id"), primary_key=True
    )
    ref_user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("app_user.id"), primary_key=True
    )

    # Relationships
    role: Mapped["Role"] = relationship(back_populates="user_roles")
    user: Mapped["AppUser"] = relationship(back_populates="user_roles")