from datetime import datetime, timedelta, timezone
import secrets
from fastapi import Depends, HTTPException
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext
from app.core.config import settings
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.requests import Request
from fastapi import status
from slowapi import Limiter
from slowapi.util import get_remote_address

import asyncio

limiter = Limiter(key_func=get_remote_address)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)


def create_access_token(
    data: dict, expires_delta: timedelta | None = None, now: datetime | None = None
):
    now = now or datetime.now(timezone.utc)
    expires_delta = expires_delta or timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode = data.copy()
    expire = now + expires_delta

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(length: int = 64) -> str:
    """
    Generate a secure random refresh token.

    length = number of bytes before encoding.
    64 bytes → 128 hex chars (~512 bits of entropy)
    """
    return secrets.token_hex(length)


def decode_token(token: str):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


class TokenAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        public_paths = {
            "/",
            "/switch_component/login",
            "/api/v1/translations/",
            "/api/v1/auth/login",
            "/api/v1/auth/logout",
            "/api/v1/auth/refresh",
        }

        admin_paths = {
            "/docs",
            "/redoc",
            "/openapi.json",
        }

        path = request.url.path

        # Always skip for static and public paths
        if path.startswith("/static") or path in public_paths:
            return await call_next(request)

        # Read token from cookie
        token = request.cookies.get("access_token")
        if not token:
            return JSONResponse({"detail": "Not authenticated"}, status_code=401)

        try:
            payload = decode_token(token)
            request.state.user = payload

            # Always skip for static and public paths
            user_roles = payload.get("roles")

            if path in admin_paths:

                if settings.ADMIN_ROLE_DENOMINATION not in user_roles:
                    return JSONResponse({"detail": "Access forbidden"}, status_code=401)

                return await call_next(request)

            return await call_next(request)
        except ExpiredSignatureError:
            return JSONResponse({"detail": "Token expired"}, status_code=401)
        except JWTError:
            return JSONResponse({"detail": "Invalid token"}, status_code=401)


class DelayMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, delay: float = 2.0):
        super().__init__(app)
        self.delay = delay

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith("/api/v1/"):
            return await call_next(request)

        # Artificial delay (2 seconds)
        await asyncio.sleep(self.delay)

        return await call_next(request)


def get_current_user(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="No token")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        user_roles: str = payload.get("roles")
        ref_household_id: str = payload.get("ref_household_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user_id,
            "roles": user_roles,
            "ref_household_id": ref_household_id,
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_no_check(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            return None
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        user_roles: str = payload.get("roles")
        if user_id is None:
            return None
        return {"id": user_id, "roles": user_roles}
    except JWTError:
        return None


def require_roles(*roles: str):

    def role_checker(user=Depends(get_current_user)):

        if not any(role in user["roles"] for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
            )

        return user

    return role_checker
