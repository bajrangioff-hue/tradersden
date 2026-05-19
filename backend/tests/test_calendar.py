"""Tests for the calendar endpoint."""

from fastapi.testclient import TestClient

from app.middleware.cache import cache


def test_calendar_returns_200(client: TestClient) -> None:
    """GET /api/v1/calendar should return 200."""
    resp = client.get("/api/v1/calendar")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "data" in data
    assert "events" in data["data"]
    assert "count" in data["data"]
    assert "meta" in data


def test_calendar_filter_by_impact(client: TestClient) -> None:
    """Calendar should filter by impact query param."""
    resp = client.get("/api/v1/calendar?impact=high")
    assert resp.status_code == 200
    data = resp.json()
    for event in data["data"]["events"]:
        assert event["impact"] == "high"


def test_calendar_cache(client: TestClient) -> None:
    """Calendar data should be cached server-side."""
    cache.clear()
    client.get("/api/v1/calendar")
    cached = cache.get("calendar:all")
    assert cached is not None
    assert isinstance(cached, list)
