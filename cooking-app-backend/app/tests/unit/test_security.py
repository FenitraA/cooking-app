from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
import time
from datetime import timedelta
from jose import JWTError, ExpiredSignatureError
from fastapi.requests import Request
from fastapi.responses import Response
from app.core.security import TokenAuthMiddleware
from fastapi import HTTPException

import pytest

from app.core.config import settings

# ------------------------
# passord utilities
# ------------------------


def test_password_hash_and_verify():
    password = "supersecret"
    hashed = hash_password(password)

    # hashed password should not equal plain password
    assert hashed != password

    # verification succeeds
    assert verify_password(password, hashed)

    # verification fails for wrong password
    assert not verify_password("wrongpassword", hashed)


# ------------------------
# Access / Refresh token creation
# ------------------------


def test_create_access_token_and_decode():
    data = {"sub": "123", "role": settings.NORMAL_ROLE_DENOMINATION}
    token = create_access_token(data, expires_delta=timedelta(minutes=1))
    payload = decode_token(token)

    assert payload["sub"] == "123"
    assert payload["role"] == settings.NORMAL_ROLE_DENOMINATION
    assert "exp" in payload


def test_create_refresh_token_and_decode():
    data = {"sub": "456"}
    token = create_refresh_token(data, expires_delta=timedelta(days=1))
    payload = decode_token(token)

    assert payload["sub"] == "456"
    assert "exp" in payload


# ------------------------
# Token decoding and errors
# ------------------------


def test_decode_invalid_token_raises():
    with pytest.raises(JWTError):
        decode_token("this.is.not.a.jwt")


def test_decode_expired_token():
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))

    time.sleep(0.1)  # ensure token is expired

    with pytest.raises(ExpiredSignatureError):
        decode_token(token)


# ------------------------
# get_current_user function
# ------------------------


def test_get_current_user_success():
    token = create_access_token({"sub": "abc", "role": settings.NORMAL_ROLE_DENOMINATION})
    scope = {
        "type": "http",
        "headers": [(b"cookie", f"access_token={token}".encode("latin-1"))],
    }
    request = Request(scope=scope)

    user = get_current_user(request)
    assert user["id"] == "abc"
    assert user["role"] == settings.NORMAL_ROLE_DENOMINATION


def test_get_current_user_no_token():
    scope = {
        "type": "http",
        "headers": [],
    }
    request = Request(scope=scope)

    with pytest.raises(HTTPException):
        get_current_user(request)


def test_get_current_user_invalid_token():
    create_access_token({"sub": "abc", "role": settings.NORMAL_ROLE_DENOMINATION})
    scope = {
        "type": "http",
        "headers": [(b"cookie", "access_token=fake".encode("latin-1"))],
    }
    request = Request(scope=scope)

    with pytest.raises(HTTPException):
        get_current_user(request)


# ------------------------
# TokenAuthMiddleware
# ------------------------


@pytest.mark.asyncio
async def test_middleware_public_path_skips():
    request = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/api/v1/auth/login",
            "headers": [],
        }
    )

    async def call_next(req):
        return Response()

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_middleware_no_token_returns_401():
    request = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/protected",
            "headers": [],
        }
    )

    async def call_next(req):
        return Response()

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 401
    assert response.body == b'{"detail":"Not authenticated"}'


@pytest.mark.asyncio
async def test_middleware_invalid_token_returns_401():
    request = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/protected",
            "headers": [(b"cookie", "access_token=fake".encode("latin-1"))],
        }
    )

    async def call_next(req):
        return Response()

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 401
    assert response.body == b'{"detail":"Invalid token"}'


@pytest.mark.asyncio
async def test_middleware_expired_token_returns_401():
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    import time

    time.sleep(0.1)

    request = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/protected",
            "headers": [(b"cookie", f"access_token={token}".encode("latin-1"))],
        }
    )

    async def call_next(req):
        return Response()

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 401
    assert response.body == b'{"detail":"Token expired"}'


@pytest.mark.asyncio
async def test_middleware_admin_access_failed():
    token = create_access_token({"sub": "1", "role": settings.NORMAL_ROLE_DENOMINATION})
    request = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/docs",
            "headers": [(b"cookie", f"access_token={token}".encode("latin-1"))],
        }
    )

    async def call_next(req):
        return Response()

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 401
    assert response.body == b'{"detail":"Access forbidden"}'
    
@pytest.mark.asyncio
async def test_middleware_admin_access_success():
    token = create_access_token(
        {"sub": "1", "role": settings.ADMIN_ROLE_DENOMINATION}
    )
    request_admin = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/docs",
            "headers": [(b"cookie", f"access_token={token}".encode("latin-1"))],
        }
    )

    async def call_next(req):
        return Response()

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request_admin, call_next)
    assert response.status_code == 200
    
@pytest.mark.asyncio
async def test_middleware_valid_token_allows_access():
    token = create_access_token({"sub": "123", "role": settings.ADMIN_ROLE_DENOMINATION})

    request = Request(scope={
        "type": "http",
        "method": "GET",
        "path": "/protected",
        "headers": [(b"cookie", f"access_token={token}".encode("latin-1"))],
    })

    async def call_next(req):
        # simulate final endpoint
        return Response(content="OK", status_code=200)

    middleware = TokenAuthMiddleware(app=lambda req: Response())
    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200
    assert response.body == b"OK"
    assert request.state.user["sub"] == "123"
    assert request.state.user["role"] == settings.ADMIN_ROLE_DENOMINATION