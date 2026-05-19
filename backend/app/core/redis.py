"""Redis client singleton."""
from __future__ import annotations

from redis.asyncio import Redis as AsyncRedis  # type: ignore[import-untyped]

from app.core.config import settings

redis_client: AsyncRedis | None = None


async def get_redis() -> AsyncRedis:
    global redis_client
    if redis_client is None:
        redis_client = await AsyncRedis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_client


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
