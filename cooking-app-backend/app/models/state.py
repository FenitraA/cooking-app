from __future__ import annotations
from typing import Optional
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

prefix = "state"


class State(Base):
    __tablename__ = "state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(32), unique=True,nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(128),nullable=False)