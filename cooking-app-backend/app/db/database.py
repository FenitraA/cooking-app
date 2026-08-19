from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


class Base(DeclarativeBase):
    pass

ENGINES = {}

if(settings.ENVIRONMENT=="dev"):
    ENGINES["dev"] = create_async_engine(settings.DEV_DATABASE_URL, echo=settings.DEBUG)
if(settings.ENVIRONMENT=="online_dev"):
    ENGINES["online_dev"] = create_async_engine(settings.ONLINE_DEV_DATABASE_URL, echo=settings.DEBUG) 
if(settings.ENVIRONMENT=="online_prod"):
    ENGINES["online_prod"] = create_async_engine(settings.ONLINE_PROD_DATABASE_URL, echo=settings.DEBUG)

# ENGINES = {
#     # "dev": create_async_engine(settings.DEV_DATABASE_URL, echo=settings.DEBUG),
#     "online_dev": create_async_engine(settings.ONLINE_DEV_DATABASE_URL, echo=settings.DEBUG),
#     "online_prod": create_async_engine(settings.ONLINE_PROD_DATABASE_URL, echo=settings.DEBUG),
# }

SESSION_MAKERS = {k: sessionmaker(bind=e, class_=AsyncSession, autoflush=False, expire_on_commit=False)
                  for k, e in ENGINES.items()}

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    env = settings.ENVIRONMENT
    session_maker = SESSION_MAKERS.get(env, SESSION_MAKERS[settings.ENVIRONMENT])
    async with session_maker() as session:
        yield session


async def init_models(engine: AsyncEngine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
