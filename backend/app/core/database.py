"""Async SQLAlchemy engine, session factory, and Base."""
from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _create_engine():
    url = settings.DATABASE_URL
    is_sqlite = "sqlite" in url
    needs_ssl = "ssl=require" in url

    kwargs: dict[str, Any] = {}
    connect_args: dict[str, Any] = {}

    if is_sqlite:
        connect_args["check_same_thread"] = False
    else:
        kwargs["pool_size"] = settings.DB_POOL_SIZE
        kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW

    if needs_ssl:
        import ssl
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        # Remove query param from URL — asyncpg handles ssl via connect_args
        url = url.replace("?ssl=require", "")
        connect_args["ssl"] = ssl_ctx

    if connect_args:
        kwargs["connect_args"] = connect_args

    return create_async_engine(
        url,
        pool_pre_ping=not is_sqlite,
        echo=settings.DB_ECHO,
        **kwargs,
    )


engine = _create_engine()

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        import logging
        logging.getLogger("tradepro.db").warning(
            "Database unavailable — skipping table creation. "
            "Set DATABASE_URL and ensure PostgreSQL is running."
        )


async def close_db() -> None:
    try:
        await engine.dispose()
    except Exception:
        pass
