from typing import TYPE_CHECKING,List

if TYPE_CHECKING:
    from app.models.endpoint_access import EndpointAccess
import uuid

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import TIMESTAMP, Integer, String, UniqueConstraint
from datetime import datetime, timezone
from app.db.database import Base

prefix = "endpoint"


class ApiEndpoint(Base):
    __tablename__ = "api_endpoint"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )

    path_name: Mapped[str] = mapped_column(String(64), nullable=False)
    method: Mapped[str] = mapped_column(String(8), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # Relationships
    endpoint_accesses: Mapped[List["EndpointAccess"]] = relationship(back_populates="api_endpoint")
    
    __table_args__ = (
        UniqueConstraint("path_name", "method", name="uix_path_name_method"),
    )
