from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.api_endpoint import ApiEndpoint
    from app.models.role import Role

from datetime import UTC, datetime

from sqlalchemy import TIMESTAMP, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class EndpointAccess(Base):
    __tablename__ = "endpoint_access"

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(UTC)
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
    ref_api_endpoint_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("api_endpoint.id"), primary_key=True
    )

    # Relationships
    role: Mapped["Role"] = relationship(back_populates="endpoint_accesses")
    api_endpoint: Mapped["ApiEndpoint"] = relationship(
        back_populates="endpoint_accesses"
    )
