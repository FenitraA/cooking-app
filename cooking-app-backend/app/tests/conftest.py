# conftest.py
from datetime import datetime, timezone
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.core.config import settings
from app.core.security import get_current_user, hash_password

from app.core import security
from app.models.app_user import AppUser



@pytest.fixture
async def default_normal_user(db_session):
    user = AppUser(
        id="default_normal_user",
        username="default_user",
        role=settings.NORMAL_ROLE_DENOMINATION,
        password_hash=hash_password("password"),
        date_ajout=datetime.now(timezone.utc),
        default_language="fr",
        etat=1,
    )

    async def override_get_current_user():
        return {"id": "default_normal_user", "role": settings.NORMAL_ROLE_DENOMINATION}

    app.dependency_overrides[get_current_user] = override_get_current_user

    db_session.add(user)
    yield user

    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
async def default_admin_user(db_session):
    user = AppUser(
        id="default_admin_user",
        username="default_user",
        role=settings.ADMIN_ROLE_DENOMINATION,
        password_hash=hash_password("password"),
        date_ajout=datetime.now(timezone.utc),
        default_language="fr",
        etat=1,
    )

    async def override_get_current_user():
        return {"id": "default_admin_user", "role": settings.ADMIN_ROLE_DENOMINATION}

    app.dependency_overrides[get_current_user] = override_get_current_user

    db_session.add(user)
    yield user

    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
async def engine():
    engine = create_async_engine(settings.TEST_DATABASE_URL, future=True, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()
    # drop at end
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(engine):
    async_session_factory = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )
    async with async_session_factory() as session:
        # start outer transaction
        async with session.begin():
            # start nested transaction (savepoint)
            async with session.begin_nested():
                yield session


@pytest.fixture
async def client(engine, db_session):
    async_session_factory = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )

    async def override_get_db():
        async with async_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def patch_middleware_token_verification(monkeypatch):
    def fake_decode_token(token: str):
        return {"sub": "fake_id", "role": "fake_role"}

    monkeypatch.setattr(security, "decode_token", fake_decode_token)
