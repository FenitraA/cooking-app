from fastapi import FastAPI
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router


from app.core.cache import lifespan
from app.core.exceptiond import sqlalchemy_exception_handler, unexpected_exception_handler
from app.core.security import DelayMiddleware
from app.core.security import limiter
from app.core.config import settings
from app.core import cloudinary

from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded



app = FastAPI(
    title="Cooking App",
    description="A FastAPI backend for the cooking webapp",
    debug=True,
    lifespan=lifespan
)


# Middleware to add cache control headers
class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response


# if settings.ENVIRONMENT == "dev":
#     app.add_middleware(DelayMiddleware, delay=1.0)
# app.add_middleware(TokenAuthMiddleware)

app.add_exception_handler(
    SQLAlchemyError,
    sqlalchemy_exception_handler,
)

app.add_exception_handler(
    Exception,
    unexpected_exception_handler,
)

app.add_middleware(CacheControlMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter application
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

app.add_middleware(SlowAPIMiddleware)
# Include all versioned routes
app.include_router(api_router, prefix="/api/v1")
