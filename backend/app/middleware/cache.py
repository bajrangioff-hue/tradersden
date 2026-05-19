"""Simple in-memory cache with TTL support."""

import time
from typing import Any, Callable

from fastapi import Request


class TTLCache:
    """Thread-safe in-memory cache with per-key TTL."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Any | None:
        """Retrieve a value from cache.

        Args:
            key: Cache key.

        Returns:
            Cached value if found and not expired, else None.
        """
        item = self._store.get(key)
        if item is None:
            return None
        value, expiry = item
        if time.monotonic() > expiry:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Store a value in cache with a TTL.

        Args:
            key: Cache key.
            value: Value to cache.
            ttl_seconds: Time-to-live in seconds (default 300).
        """
        self._store[key] = (value, time.monotonic() + ttl_seconds)

    def clear(self) -> None:
        """Clear all cached entries."""
        self._store.clear()

    def delete(self, key: str) -> None:
        """Remove a specific key from cache.

        Args:
            key: Cache key to remove.
        """
        self._store.pop(key, None)


# Singleton instance
cache = TTLCache()


def cached(ttl: int = 300) -> Callable:
    """Decorator that caches the return value of an async endpoint.

    The cache key is derived from the request URL path + query string.

    Args:
        ttl: Time-to-live in seconds (default 300s / 5 min).

    Returns:
        Decorated function with caching.
    """
    def decorator(func: Callable) -> Callable:
        async def wrapper(request: Request, *args: Any, **kwargs: Any) -> Any:
            key_parts = [request.url.path]
            if request.url.query:
                key_parts.append(request.url.query)
            cache_key = ":".join(key_parts)
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            result = await func(request, *args, **kwargs)
            cache.set(cache_key, result, ttl_seconds=ttl)
            return result
        return wrapper
    return decorator
