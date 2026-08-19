from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.user_role import UserRole
    from app.models.endpoint_access import EndpointAccess

import uuid

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import TIMESTAMP, ForeignKey, Integer, String
from datetime import datetime, timezone
from app.db.database import Base

prefix = "role"


class Role(Base):
    __tablename__ = "role"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    role_name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(128), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Foreign keys
    ref_parent_role_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("role.id"), nullable=True
    )

    # Relationships
    parent_role: Mapped["Role"] = relationship(
        remote_side=[id],
        foreign_keys=[ref_parent_role_id],
        back_populates="child_roles",
    )
    child_roles = relationship("Role", back_populates="parent_role")
    endpoint_accesses: Mapped[List["EndpointAccess"]] = relationship(
        back_populates="role"
    )
    user_roles: Mapped[List["UserRole"]] = relationship(back_populates="role")

    @staticmethod
    def generate_id():
        """Generate a prefixed UUID string ID"""
        return f"{prefix}_{uuid.uuid4()}"
