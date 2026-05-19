"""Tests for the analyze endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.middleware.cache import cache


@pytest.mark.slow
def test_analyze_spy_returns_valid_response(client: TestClient) -> None:
    """GET /api/v1/analyze/SPY should return a valid analysis."""
    resp = client.get("/api/v1/analyze/SPY")
    if resp.status_code == 200:
        data = resp.json()
        assert data["status"] == "success"
        assert "data" in data
        assert "symbol" in data["data"]
        assert data["data"]["symbol"] == "SPY"
        assert "meta" in data
    elif resp.status_code == 404:
        pytest.skip("Market data unavailable for SPY")
    else:
        pytest.fail(f"Unexpected status {resp.status_code}: {resp.text}")


def test_analyze_invalid_symbol_returns_400(client: TestClient) -> None:
    """GET /api/v1/analyze/INVALID should return 400."""
    resp = client.get("/api/v1/analyze/INVALID")
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    assert "error" in data
    assert data["error"]["code"] == "INVALID_SYMBOL"


def test_analyze_bad_format_returns_422(client: TestClient) -> None:
    """GET /api/v1/analyze/X returns 422 (FastAPI path validation)."""
    resp = client.get("/api/v1/analyze/X")
    assert resp.status_code == 422


def test_error_response_format(client: TestClient) -> None:
    """Error responses should have status, error, and meta keys."""
    resp = client.get("/api/v1/analyze/ZZZZZ")
    assert resp.status_code == 400
    data = resp.json()
    assert "status" in data
    assert "error" in data
    assert "meta" in data


def test_cache_hit(client: TestClient) -> None:
    """After first call, cached response should be returned."""
    cache.clear()
    resp1 = client.get("/api/v1/analyze/SPY")
    if resp1.status_code != 200:
        pytest.skip("Market data unavailable")
    cached = cache.get("analyze:SPY")
    assert cached is not None
    assert cached["symbol"] == "SPY"
