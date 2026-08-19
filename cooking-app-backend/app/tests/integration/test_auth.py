from datetime import timedelta
import pytest

from app.core.security import create_refresh_token, decode_token

# ------------------------
# /login
# ------------------------


@pytest.mark.asyncio
async def test_login_success(client, db_session, user_factory):
    normal_user = await user_factory()
    await db_session.commit()
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": normal_user.username,
            "password": normal_user._plain_password,
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.json()["message"] == "Login successful"


@pytest.mark.asyncio
async def test_login_failure_expired_user(client, db_session, user_factory):
    deleted_user = await user_factory(etat=0)
    await db_session.commit()
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": deleted_user.username,
            "password": deleted_user._plain_password,
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_login_failure_wrong_username(client):
    response = await client.post(
        "/api/v1/auth/login", json={"username": "wrong", "password": "bad"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_login_failure_wrong_password(client, db_session, user_factory):
    normal_user = await user_factory()
    await db_session.commit()
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": normal_user.username, "password": "wrongpass"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_login_token_payload(client, db_session, user_factory):
    normal_user = await user_factory()
    await db_session.commit()
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": normal_user.username,
            "password": normal_user._plain_password,
        },
    )
    token = response.cookies["access_token"]

    # decode JWT
    payload = decode_token(token)
    assert payload["sub"] == normal_user.id
    assert payload["role"] == normal_user.role
    assert payload["default_language"] == normal_user.default_language


# ------------------------
# /refresh
# ------------------------


@pytest.mark.asyncio
async def test_refresh_missing_cookie(client):
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token missing"


@pytest.mark.asyncio
async def test_refresh_invalid_token(client):
    client.cookies.set("refresh_token", "not-a-valid-token")
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_expired_token(client, db_session, user_factory):
    normal_user = await user_factory()
    await db_session.commit()
    expired_token = create_refresh_token(
        {"sub": normal_user.id}, expires_delta=timedelta(seconds=-1)
    )
    client.cookies.set("refresh_token", expired_token)
    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_refresh_valid_token(client, db_session, user_factory):
    normal_user = await user_factory()
    await db_session.commit()
    refresh_token = create_refresh_token({"sub": normal_user.id}, timedelta(minutes=5))
    client.cookies.set("refresh_token", refresh_token)

    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert response.json()["message"] == "Token refreshed"


@pytest.mark.asyncio
async def test_refresh_user_deleted(client, db_session, user_factory):
    deleted_user = await user_factory(etat=0)
    await db_session.commit()
    # Create token first
    refresh_token = create_refresh_token({"sub": deleted_user.id}, timedelta(minutes=5))
    client.cookies.set("refresh_token", refresh_token)

    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid user id"


# ------------------------
# /logout
# ------------------------


@pytest.mark.asyncio
async def test_logout_clears_cookies(client):

    # Call logout
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out"

    # Check that the server sent Set-Cookie headers to delete cookies
    set_cookie_headers = (
        response.headers.get_list("set-cookie")
        if hasattr(response.headers, "get_list")
        else response.headers.get_all("set-cookie", [])
    )

    # Check that access_token and refresh_token are being deleted
    assert any(
        "access_token=" in cookie and "Max-Age=0" in cookie
        for cookie in set_cookie_headers
    )
    assert any(
        "refresh_token=" in cookie and "Max-Age=0" in cookie
        for cookie in set_cookie_headers
    )


@pytest.mark.asyncio
async def test_logout_without_login(client):
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out"
