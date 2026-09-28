from typing import Any, Callable
from fastapi import Request, Response
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
        prefix="cooking-app-cache",
    )

    yield

    await redis.aclose()

def household_aware_key_builder(
        func: Callable[..., Any],
        namespace: str = "",
        request: Request | None = None,
        response: Response | None = None,
        *args: Any,
        **kwargs: Any,
) -> str:
    cache_kwargs = {}
    for k, v in kwargs.items():
        # 1. Ignore unhashable dependencies
        if k in ["db", "request", "response"]:
            continue

        # 2. Extract household ID safely to isolate cache per tenant
        if k == "current_user":
            if isinstance(v, dict) and "ref_household_id" in v:
                cache_kwargs["household_id"] = v["ref_household_id"]
            elif hasattr(v, "ref_household_id"):
                cache_kwargs["household_id"] = v.ref_household_id
            continue

        cache_kwargs[k] = v

    # 3. Sort arguments to ensure consistent cache keys
    sorted_kwargs = sorted(cache_kwargs.items())
    kwargs_str = "&".join([f"{k}={v}" for k, v in sorted_kwargs])

    return f"{namespace}:{func.__name__}:{kwargs_str}"