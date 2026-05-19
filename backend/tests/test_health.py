"""Tests for the health check endpoint."""

from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    """GET /api/v1/health should return 200 with status and version."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["version"], str)
    assert len(data["version"]) > 0
