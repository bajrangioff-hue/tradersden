"""Pytest fixtures for backend tests."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Provide a TestClient for the FastAPI application."""
    with TestClient(app) as c:
        yield c
