import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis.asyncio import Redis

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):

    redis = Redis.from_url(
        settings.REDIS_URL,
        decode_responses=False,
    )

    FastAPICache.init(
        RedisBackend(redis),
        prefix="myapp-cache",
    )

    yield

    await redis.aclose()

