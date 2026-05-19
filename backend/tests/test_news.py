"""Tests for the news endpoint."""

from fastapi.testclient import TestClient

from app.middleware.cache import cache


def test_news_returns_200(client: TestClient) -> None:
    """GET /api/v1/news/SPY should return 200."""
    resp = client.get("/api/v1/news/SPY")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "data" in data
    assert "articles" in data["data"]
    assert "count" in data["data"]


def test_news_invalid_symbol_returns_400(client: TestClient) -> None:
    """GET /api/v1/news/INVALID should return 400."""
    resp = client.get("/api/v1/news/INVALID")
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"

    cache.clear()


def test_news_cache(client: TestClient) -> None:
    """News data should be cached server-side."""
    cache.clear()
    client.get("/api/v1/news/SPY")
    cached = cache.get("news:SPY")
    assert cached is not None
    assert isinstance(cached, list)
