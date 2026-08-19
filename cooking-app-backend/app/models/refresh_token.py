from typing import TYPE_CHECKING

from app.core.security import create_refresh_token

if TYPE_CHECKING:
    from app.models.app_user import AppUser

from datetime import datetime, timedelta, timezone
from sqlalchemy import TIMESTAMP, Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.core.config import settings
import uuid
import hashlib
import hmac


prefix = "refresh_token"


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"{prefix}_{uuid.uuid4()}",
    )
    token_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=7),
    )
    revoked_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=None,
        nullable=True,
    )
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(16), nullable=True)
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Foreign keys
    ref_user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("app_user.id"), nullable=False
    )

    # Relationships
    user: Mapped["AppUser"] = relationship(back_populates="refresh_tokens")
    
    def revoke_token(self):
        """Revoke this refresh token"""
        self.revoked_at = datetime.now(timezone.utc)
        self.state = -1
        return 
    
    def get_heir_token(self) -> tuple["RefreshToken", str]:
        """Get the new token for rotation"""
        new_token_value = create_refresh_token()
        new_token = RefreshToken(
            token_hash=RefreshToken.hash_refresh(new_token_value),
            created_at=datetime.now(timezone.utc),
            user_agent=self.user_agent,
            ip_address=self.ip_address,
            expires_at=self.expires_at,
            ref_user_id=self.ref_user_id,
        )
        return new_token,new_token_value

    @staticmethod
    def generate_id():
        """Generate a prefixed UUID string ID"""
        return f"{prefix}_{uuid.uuid4()}"

    @staticmethod
    def hash_refresh(token: str) -> str:
        """Generate the Hash of a refresh token"""
        secret = settings.REFRESH_TOKEN_SECRET_KEY
        return hmac.new(secret.encode(), token.encode(), hashlib.sha256).hexdigest()
