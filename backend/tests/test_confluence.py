"""Tests for confluence and setup endpoints (most require PostgreSQL)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas.confluence import AnalyzeResponse, ConfluenceLevelOut, LevelUpdate
from app.schemas.setup import SetupCreate, SetupOut


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
    email = "confluence-test-user@example.com"
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    _shared_headers.update(h)
    return h


# ── Schema unit tests (no DB) ──


def test_confluence_level_out_schema() -> None:
    lvl = ConfluenceLevelOut(
        level_type="ORDER_BLOCK",
        price=400.0,
        high=402.0,
        low=398.0,
        direction="bullish",
        confluence_score=85.5,
        strength="strong",
    )
    assert lvl.level_type == "ORDER_BLOCK"
    assert lvl.confluence_score == 85.5
    assert lvl.is_mitigated is False


def test_confluence_level_out_defaults() -> None:
    lvl = ConfluenceLevelOut(level_type="FVG", price=100.0)
    assert lvl.confluence_score == 0.0
    assert lvl.strength == "weak"
    assert lvl.source_modules == []


def test_analyze_response_schema() -> None:
    resp = AnalyzeResponse(
        symbol="SPY",
        interval="1h",
        levels=[
            ConfluenceLevelOut(level_type="OB", price=400.0, direction="bullish", confluence_score=90.0)
        ],
        score=90.0,
        direction="BULLISH",
        grade="A",
        narrative="Strong setup",
    )
    assert resp.symbol == "SPY"
    assert len(resp.levels) == 1
    assert resp.score == 90.0


def test_level_update_schema() -> None:
    upd = LevelUpdate(notes="Updated note", is_favorite=True, is_mitigated=True)
    assert upd.notes == "Updated note"
    assert upd.is_favorite is True
    assert upd.is_mitigated is True


def test_level_update_partial() -> None:
    upd = LevelUpdate(notes="Just notes")
    assert upd.is_favorite is None
    assert upd.is_mitigated is None


def test_setup_create_schema() -> None:
    s = SetupCreate(
        symbol="SPY",
        title="My Setup",
        analysis_snapshot={"direction": "BULLISH", "score": 85.0},
        level_ids=["00000000-0000-0000-0000-000000000001"],
    )
    assert s.symbol == "SPY"
    assert s.title == "My Setup"
    assert s.analysis_snapshot["score"] == 85.0


def test_setup_create_invalid_symbol_length() -> None:
    with pytest.raises(ValidationError):
        SetupCreate(
            symbol="X" * 21,
            analysis_snapshot={},
        )


# ── Confluence endpoint tests (need DB) ──


@need_db
def test_analyze_confluence_missing_symbol(client: TestClient) -> None:
    h = _register(client)
    resp = client.post("/api/v1/confluence/analyze", headers=h)
    assert resp.status_code == 422


@need_db
def test_analyze_confluence_invalid_interval(client: TestClient) -> None:
    h = _register(client)
    resp = client.post("/api/v1/confluence/analyze?symbol=SPY&interval=99m", headers=h)
    assert resp.status_code == 422


@need_db
def test_analyze_confluence_success(client: TestClient) -> None:
    h = _register(client)
    resp = client.post("/api/v1/confluence/analyze?symbol=SPY&interval=1h&period=5d", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "SPY"
    assert data["interval"] == "1h"
    assert isinstance(data["levels"], list)
    assert len(data["levels"]) > 0
    assert "score" in data
    assert "direction" in data
    assert "grade" in data
    assert "narrative" in data
    assert "full_analysis" in data


@need_db
def test_analyze_confluence_result_structure(client: TestClient) -> None:
    h = _register(client)
    resp = client.post("/api/v1/confluence/analyze?symbol=SPY&interval=1h&period=5d", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    first = data["levels"][0]
    assert "level_type" in first
    assert "price" in first
    assert "confluence_score" in first
    assert "strength" in first
    assert "direction" in first


@need_db
def test_analyze_and_save_persists_levels(client: TestClient) -> None:
    h = _register(client)
    resp = client.post("/api/v1/confluence/analyze-and-save?symbol=SPY&interval=1h", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["levels"]) > 0


@need_db
def test_list_levels_by_symbol(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=AAPL&interval=1h", headers=h)
    resp = client.get("/api/v1/confluence/levels?symbol=AAPL", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert all(l["symbol"] == "AAPL" for l in resp.json())


@need_db
def test_list_levels_empty_symbol(client: TestClient) -> None:
    h = _register(client)
    resp = client.get("/api/v1/confluence/levels?symbol=NONEXISTENT", headers=h)
    assert resp.status_code == 200
    assert resp.json() == []


@need_db
def test_list_levels_filter_timeframe(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=MSFT&interval=1h", headers=h)
    resp = client.get("/api/v1/confluence/levels?symbol=MSFT&time_frame=1h", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    if data:
        assert all(l["time_frame"] == "1h" for l in data)


@need_db
def test_update_level_notes(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=TSLA&interval=1h", headers=h)
    levels = client.get("/api/v1/confluence/levels?symbol=TSLA", headers=h).json()
    if not levels:
        pytest.skip("No levels saved")
    lvl_id = levels[0]["id"]
    resp = client.patch(
        f"/api/v1/confluence/levels/{lvl_id}",
        json={"notes": "Key support level"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Key support level"


@need_db
def test_update_level_favorite(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=TSLA&interval=1h", headers=h)
    levels = client.get("/api/v1/confluence/levels?symbol=TSLA", headers=h).json()
    if not levels:
        pytest.skip("No levels saved")
    lvl_id = levels[0]["id"]
    resp = client.patch(
        f"/api/v1/confluence/levels/{lvl_id}",
        json={"is_favorite": True},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is True


@need_db
def test_update_level_mitigate(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=TSLA&interval=1h", headers=h)
    levels = client.get("/api/v1/confluence/levels?symbol=TSLA", headers=h).json()
    if not levels:
        pytest.skip("No levels saved")
    lvl_id = levels[0]["id"]
    resp = client.patch(
        f"/api/v1/confluence/levels/{lvl_id}",
        json={"is_mitigated": True},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["is_mitigated"] is True


@need_db
def test_delete_level(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=GOOG&interval=1h", headers=h)
    levels = client.get("/api/v1/confluence/levels?symbol=GOOG", headers=h).json()
    if not levels:
        pytest.skip("No levels saved")
    lvl_id = levels[0]["id"]
    resp = client.delete(f"/api/v1/confluence/levels/{lvl_id}", headers=h)
    assert resp.status_code == 204
    check = client.get(f"/api/v1/confluence/levels/{lvl_id}", headers=h)
    assert check.status_code == 404


@need_db
def test_update_level_not_found(client: TestClient) -> None:
    h = _register(client)
    resp = client.patch(
        "/api/v1/confluence/levels/00000000-0000-0000-0000-000000000000",
        json={"notes": "test"},
        headers=h,
    )
    assert resp.status_code == 404


@need_db
def test_confluence_unauthorized(client: TestClient) -> None:
    resp = client.post("/api/v1/confluence/analyze?symbol=SPY")
    assert resp.status_code == 401


# ── Setup endpoint tests (need DB) ──


@need_db
def test_create_setup(client: TestClient) -> None:
    h = _register(client)
    resp = client.post(
        "/api/v1/setups",
        json={
            "symbol": "SPY",
            "title": "Evening setup",
            "analysis_snapshot": {"direction": "BULLISH", "score": 85.0},
        },
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["symbol"] == "SPY"
    assert data["title"] == "Evening setup"
    assert data["analysis_snapshot"]["score"] == 85.0
    assert "id" in data
    assert "created_at" in data


@need_db
def test_list_setups(client: TestClient) -> None:
    h = _register(client)
    client.post(
        "/api/v1/setups",
        json={"symbol": "SPY", "analysis_snapshot": {"dir": "BULLISH"}},
        headers=h,
    )
    client.post(
        "/api/v1/setups",
        json={"symbol": "QQQ", "analysis_snapshot": {"dir": "BEARISH"}},
        headers=h,
    )
    resp = client.get("/api/v1/setups", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    symbols = [s["symbol"] for s in data]
    assert "SPY" in symbols
    assert "QQQ" in symbols


@need_db
def test_get_setup_by_id(client: TestClient) -> None:
    h = _register(client)
    created = client.post(
        "/api/v1/setups",
        json={"symbol": "SPY", "title": "Get test", "analysis_snapshot": {}},
        headers=h,
    ).json()
    resp = client.get(f"/api/v1/setups/{created['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]
    assert resp.json()["title"] == "Get test"


@need_db
def test_get_setup_not_found(client: TestClient) -> None:
    h = _register(client)
    resp = client.get("/api/v1/setups/00000000-0000-0000-0000-000000000000", headers=h)
    assert resp.status_code == 404


@need_db
def test_delete_setup(client: TestClient) -> None:
    h = _register(client)
    created = client.post(
        "/api/v1/setups",
        json={"symbol": "SPY", "analysis_snapshot": {"dir": "UP"}},
        headers=h,
    ).json()
    resp = client.delete(f"/api/v1/setups/{created['id']}", headers=h)
    assert resp.status_code == 204
    check = client.get(f"/api/v1/setups/{created['id']}", headers=h)
    assert check.status_code == 404


@need_db
def test_delete_setup_not_found(client: TestClient) -> None:
    h = _register(client)
    resp = client.delete("/api/v1/setups/00000000-0000-0000-0000-000000000000", headers=h)
    assert resp.status_code == 404


@need_db
def test_setup_unauthorized(client: TestClient) -> None:
    resp = client.get("/api/v1/setups")
    assert resp.status_code == 401


@need_db
def test_create_setup_with_level_ids(client: TestClient) -> None:
    h = _register(client)
    client.post("/api/v1/confluence/analyze-and-save?symbol=AAPL&interval=1h", headers=h)
    levels = client.get("/api/v1/confluence/levels?symbol=AAPL", headers=h).json()
    level_ids = [l["id"] for l in levels[:2]]
    resp = client.post(
        "/api/v1/setups",
        json={
            "symbol": "AAPL",
            "title": "With levels",
            "analysis_snapshot": {"score": 90},
            "level_ids": level_ids,
        },
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["level_ids"]) == len(level_ids)
    for lid in level_ids:
        assert lid in data["level_ids"]
