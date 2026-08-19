from datetime import datetime, timezone
import pytest
from app.core.config import settings
from app.core.security import hash_password
from app.models.app_user import AppUser

# --------------------------
# User Factory
# --------------------------


@pytest.fixture
def user_factory(db_session):
    async def create_user(
        username="alice",
        role=settings.NORMAL_ROLE_DENOMINATION,
        etat=1,
        password="secret1",
    ):
        
        user = AppUser(
            id=await AppUser.generate_next_id(db_session),
            username=username,
            role=role,
            password_hash=hash_password(password),
            date_ajout=datetime.now(timezone.utc),
            default_language="fr",
            etat=etat,
        )
        db_session.add(user)

        user._plain_password = password
        return user

    return create_user

