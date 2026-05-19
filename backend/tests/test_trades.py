"""Tests for trade and tag endpoints (require PostgreSQL)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def _db_available() -> bool:
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

_shared_headers: dict[str, str] = {}


@need_db
def _register(client: TestClient) -> dict[str, str]:
    email = "trade-test-user@example.com"
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    token = data["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    _shared_headers.update(h)
    return h


# ── Tags ──


@need_db
def test_create_tag(client: TestClient) -> None:
    h = _register(client)
    resp = client.post("/api/v1/tags", json={"name": "ICT 2022", "color": "#ff0000"}, headers=h)
    assert resp.status_code == 201
    assert resp.json()["name"] == "ICT 2022"
    assert resp.json()["color"] == "#ff0000"
    assert "id" in resp.json()


@need_db
def test_create_duplicate_tag(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/tags", json={"name": "dup-tag"}, headers=h)
    resp = client.post("/api/v1/tags", json={"name": "dup-tag"}, headers=h)
    assert resp.status_code == 409


@need_db
def test_list_tags(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/tags", json={"name": "Tag A"}, headers=h)
    client.post("/api/v1/tags", json={"name": "Tag B"}, headers=h)
    resp = client.get("/api/v1/tags", headers=h)
    assert resp.status_code == 200
    names = [t["name"] for t in resp.json()]
    assert "Tag A" in names
    assert "Tag B" in names


@need_db
def test_update_tag(client: TestClient) -> None:
    h = _register(client)
    created = client.post("/api/v1/tags", json={"name": "Old", "color": "#000000"}, headers=h).json()
    resp = client.patch(f"/api/v1/tags/{created['id']}", json={"name": "New"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


@need_db
def test_delete_tag(client: TestClient) -> None:
    h = _register(client)
    created = client.post("/api/v1/tags", json={"name": "DeleteMe"}, headers=h).json()
    resp = client.delete(f"/api/v1/tags/{created['id']}", headers=h)
    assert resp.status_code == 204


# ── Trades ──


@need_db
def test_create_trade_long(client: TestClient) -> None:
    h = _register(client)
    resp = client.post(
        "/api/v1/trades",
        json={
            "symbol": "SPY",
            "direction": "LONG",
            "entry_price": 400.0,
            "exit_price": 410.0,
            "quantity": 10,
            "entry_time": "2026-01-15T14:30:00Z",
            "exit_time": "2026-01-15T15:00:00Z",
            "commission": 1.0,
        },
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["symbol"] == "SPY"
    assert data["direction"] == "LONG"
    assert data["outcome"] == "WIN"
    assert data["pnl"] is not None
    assert data["pnl"] > 0


@need_db
def test_create_trade_short_loss(client: TestClient) -> None:
    h = _register(client)
    resp = client.post(
        "/api/v1/trades",
        json={
            "symbol": "QQQ",
            "direction": "SHORT",
            "entry_price": 500.0,
            "exit_price": 510.0,
            "quantity": 5,
            "entry_time": "2026-01-15T14:30:00Z",
            "commission": 0.5,
        },
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["outcome"] == "LOSS"
    assert data["pnl"] < 0


@need_db
def test_list_trades_pagination(client: TestClient) -> None:
    h = _register(client)
    for i in range(5):
        client.post(
            "/api/v1/trades",
            json={
                "symbol": "SPY",
                "direction": "LONG",
                "entry_price": 400.0 + i,
                "quantity": 1,
                "entry_time": f"2026-01-{10+i:02d}T14:30:00Z",
            },
            headers=h,
        )
    resp = client.get("/api/v1/trades?page=1&page_size=3", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["trades"]) == 3
    assert data["total"] == 5
    assert data["total_pages"] == 2


@need_db
def test_list_trades_filter_symbol(client: TestClient) -> None:
    h = _register(client)
    client.post(
        "/api/v1/trades",
        json={"symbol": "AAPL", "direction": "LONG", "entry_price": 150.0, "quantity": 1,
              "entry_time": "2026-02-01T14:30:00Z"},
        headers=h,
    )
    client.post(
        "/api/v1/trades",
        json={"symbol": "SPY", "direction": "LONG", "entry_price": 400.0, "quantity": 1,
              "entry_time": "2026-02-01T14:30:00Z"},
        headers=h,
    )
    resp = client.get("/api/v1/trades?symbol=AAPL", headers=h)
    assert resp.status_code == 200
    assert all(t["symbol"] == "AAPL" for t in resp.json()["trades"])


@need_db
def test_get_trade(client: TestClient) -> None:
    h = _register(client)
    created = client.post(
        "/api/v1/trades",
        json={"symbol": "SPY", "direction": "LONG", "entry_price": 400.0, "quantity": 1,
              "entry_time": "2026-03-01T14:30:00Z"},
        headers=h,
    ).json()
    resp = client.get(f"/api/v1/trades/{created['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


@need_db
def test_update_trade_add_exit(client: TestClient) -> None:
    h = _register(client)
    created = client.post(
        "/api/v1/trades",
        json={"symbol": "SPY", "direction": "LONG", "entry_price": 400.0, "quantity": 1,
              "entry_time": "2026-04-01T14:30:00Z"},
        headers=h,
    ).json()
    assert created["outcome"] is None

    resp = client.patch(
        f"/api/v1/trades/{created['id']}",
        json={"exit_price": 420.0, "exit_time": "2026-04-01T15:00:00Z"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["outcome"] == "WIN"
    assert resp.json()["pnl"] > 0


@need_db
def test_delete_trade(client: TestClient) -> None:
    h = _register(client)
    created = client.post(
        "/api/v1/trades",
        json={"symbol": "SPY", "direction": "LONG", "entry_price": 400.0, "quantity": 1,
              "entry_time": "2026-05-01T14:30:00Z"},
        headers=h,
    ).json()
    resp = client.delete(f"/api/v1/trades/{created['id']}", headers=h)
    assert resp.status_code == 204
    get_resp = client.get(f"/api/v1/trades/{created['id']}", headers=h)
    assert get_resp.status_code == 404


@need_db
def test_trade_not_found(client: TestClient) -> None:
    h = _register(client)
    resp = client.get("/api/v1/trades/00000000-0000-0000-0000-000000000000", headers=h)
    assert resp.status_code == 404


@need_db
def test_trade_unauthorized(client: TestClient) -> None:
    resp = client.get("/api/v1/trades")
    assert resp.status_code == 401


@need_db
def test_create_trade_with_tags(client: TestClient) -> None:
    h = _register(client)
    resp = client.post(
        "/api/v1/trades",
        json={
            "symbol": "SPY",
            "direction": "SHORT",
            "entry_price": 450.0,
            "exit_price": 440.0,
            "quantity": 5,
            "entry_time": "2026-06-01T14:30:00Z",
            "setup_tags": ["ICT 2022", "FVG"],
            "session": "NY",
            "grade_at_entry": "A",
        },
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "ICT 2022" in data["setup_tags"]
    assert data["session"] == "NY"
    assert data["grade_at_entry"] == "A"
