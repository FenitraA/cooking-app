from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.app_user import AppUser
from app.models.refresh_token import RefreshToken
from app.schemas.exceptions import RefreshTokenNotFound


class RefreshTokenCRUD:
    async def create(
        self,
        db: AsyncSession,
        token_hash: str,
        user_id: str,
        created_at: datetime,
        expire_at: datetime,
    ) -> RefreshToken:
        new_refresh_token = RefreshToken(
            token_hash=token_hash,
            ref_user_id=user_id,
            created_at=created_at,
            expires_at=expire_at,
        )
        db.add(new_refresh_token)
        await db.flush()
        await db.refresh(new_refresh_token)
        return new_refresh_token

    async def get_valid_token(self, db: AsyncSession, token_hash: str):
        stmt = (
            select(RefreshToken, AppUser)
            .join(AppUser, AppUser.id == RefreshToken.ref_user_id)
            .where(RefreshToken.token_hash == token_hash)
        )
        result = await db.execute(stmt)
        row = result.one_or_none()  # raises if multiple rows
        if row is None:
            return None
        
        refresh_token, user = row
        
        if refresh_token is None:
            raise RefreshTokenNotFound("Refresh token not found")

        now = datetime.now(timezone.utc)
        is_revoked = refresh_token.revoked_at is not None
        is_inactive = refresh_token.state <= 0
        is_expired = refresh_token.expires_at < now

        if is_revoked or is_inactive or is_expired:
            raise RefreshTokenNotFound("Refresh token is invalid, expired, or revoked")

        return refresh_token,user


refresh_token_crud_instance = RefreshTokenCRUD()
