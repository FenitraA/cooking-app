import uuid

from sqlalchemy import  String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

prefix = "counter"

class Counter(Base):
    __tablename__ = "counter"
    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )
    name : Mapped[str] = mapped_column(String(128),unique=True, nullable=False)
    current_value : Mapped[int] = mapped_column(Integer, nullable=False, default=0)