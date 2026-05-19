"""Tests for auth and user endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def _db_available() -> bool:
    """Quick check — try importing asyncpg and connecting."""
    try:
        from app.core.config import settings
        import asyncpg
        import asyncio
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(
                asyncpg.connect(settings.DATABASE_URL.replace("+asyncpg", ""), timeout=3)
            )
            return True
        except Exception:
            return False
        finally:
            loop.close()
    except Exception:
        return False


need_db = pytest.mark.skipif(not _db_available(), reason="PostgreSQL not available")


# ── Registration ──


@need_db
def test_register_success(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "testpass123", "display_name": "Tester"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@need_db
def test_register_duplicate_email(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "testpass123"},
    )
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 409
    assert "already registered" in resp.json()["detail"].lower()


@need_db
def test_register_short_password(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "1234567"},
    )
    assert resp.status_code == 422


# ── Login ──


@need_db
def test_login_success(client: TestClient) -> None:
    email = "login-test@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "testpass123"})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "testpass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@need_db
def test_login_wrong_password(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login-test@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


@need_db
def test_login_nonexistent_user(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 401


# ── Token Refresh ──


@need_db
def test_refresh_success(client: TestClient) -> None:
    email = "refresh-test@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "testpass123"})
    refresh_token = reg.json()["refresh_token"]

    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@need_db
def test_refresh_invalid_token(client: TestClient) -> None:
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": "definitely-fake-token"})
    assert resp.status_code == 401


# ── Logout ──


@need_db
def test_logout(client: TestClient) -> None:
    email = "logout-test@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "testpass123"})
    token = reg.json()["access_token"]

    resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204


# ── Get Current User ──


@need_db
def test_me(client: TestClient) -> None:
    email = "me-test@example.com"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123", "display_name": "Me"},
    )
    token = reg.json()["access_token"]

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == email
    assert data["display_name"] == "Me"
    assert "id" in data


@need_db
def test_me_unauthorized(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


# ── Update Profile ──


@need_db
def test_update_profile(client: TestClient) -> None:
    email = "update-test@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "testpass123"})
    token = reg.json()["access_token"]

    resp = client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"display_name": "Updated Name"},
    )
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "Updated Name"


# ── Preferences ──


@need_db
def test_preferences(client: TestClient) -> None:
    email = "pref-test@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "testpass123"})
    token = reg.json()["access_token"]

    put = client.put(
        "/api/v1/users/me/preferences",
        headers={"Authorization": f"Bearer {token}"},
        json={"preferences": {"theme": "dark", "timeframe": "1h"}},
    )
    assert put.status_code == 200
    assert put.json()["preferences"]["theme"] == "dark"

    get = client.get(
        "/api/v1/users/me/preferences",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get.status_code == 200
    assert get.json()["preferences"]["theme"] == "dark"
