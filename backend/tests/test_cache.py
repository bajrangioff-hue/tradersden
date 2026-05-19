"""Tests for the in-memory cache."""

import time

from app.middleware.cache import TTLCache


def test_cache_set_get() -> None:
    c = TTLCache()
    c.set("key1", "value1", ttl_seconds=60)
    assert c.get("key1") == "value1"


def test_cache_miss() -> None:
    c = TTLCache()
    assert c.get("nonexistent") is None


def test_cache_expiry() -> None:
    c = TTLCache()
    c.set("key2", "value2", ttl_seconds=1)
    assert c.get("key2") == "value2"
    time.sleep(1.1)
    assert c.get("key2") is None


def test_cache_clear() -> None:
    c = TTLCache()
    c.set("a", 1)
    c.set("b", 2)
    c.clear()
    assert c.get("a") is None
    assert c.get("b") is None


def test_cache_delete() -> None:
    c = TTLCache()
    c.set("x", 100)
    c.delete("x")
    assert c.get("x") is None
