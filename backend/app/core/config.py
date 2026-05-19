"""Application configuration using environment variables."""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# ── Load .env from backend/ directory ──
_dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _dotenv_path.exists():
    load_dotenv(dotenv_path=_dotenv_path, override=True)
else:
    # Fallback: search CWD and parents
    load_dotenv(override=True)


class Settings:
    APP_TITLE: str = "TradePro Delivery System"
    APP_VERSION: str = "3.0.0"
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def CORS_ORIGINS(self) -> list[str]:
        raw = os.getenv("CORS_ORIGINS", "*")
        if raw == "*":
            return ["*"]
        raw = raw.strip()
        if raw.startswith("["):
            import json
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass
        return [o.strip() for o in raw.split(",")]

    YFINANCE_TIMEOUT: int = int(os.getenv("YFINANCE_TIMEOUT", "30"))
    CALENDAR_URL: str = os.getenv(
        "CALENDAR_URL",
        "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    )
    CALENDAR_TIMEOUT: int = int(os.getenv("CALENDAR_TIMEOUT", "15"))

    # ── Database ──
    # Set DATABASE_URL in .env or environment to use PostgreSQL.
    # Default: try local PostgreSQL, fall back to SQLite.
    _db_url: str | None = os.getenv("DATABASE_URL")

    @property
    def DATABASE_URL(self) -> str:
        if self._db_url:
            if "ssl=require" not in self._db_url:
                return self._db_url
            return self._db_url
        # Auto-detect: try localhost PostgreSQL, fall back to SQLite
        import logging
        logger = logging.getLogger("tradepro.config")
        url = "postgresql+asyncpg://tradepro:tradepro@localhost:5432/tradepro"
        try:
            import asyncpg
            import asyncio
            loop = asyncio.new_event_loop()
            try:
                loop.run_until_complete(
                    asyncpg.connect(url.replace("+asyncpg", ""), timeout=3)
                )
                logger.info("PostgreSQL available — using it")
                return url
            except Exception:
                pass
            finally:
                loop.close()
        except ImportError:
            pass
        fallback = "sqlite+aiosqlite:///./tradepro_dev.db"
        logger.warning(
            "PostgreSQL unavailable — falling back to SQLite (%s). "
            "Set DATABASE_URL to use a different database.",
            fallback,
        )
        return fallback

    @property
    def DB_POOL_SIZE(self) -> int:
        return int(os.getenv("DB_POOL_SIZE", "5"))

    @property
    def DB_MAX_OVERFLOW(self) -> int:
        return int(os.getenv("DB_MAX_OVERFLOW", "0"))

    @property
    def DB_ECHO(self) -> bool:
        return os.getenv("DB_ECHO", "0") == "1"

    # ── Redis ──
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ── JWT ──
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_EXPIRE", "15"))
    JWT_REFRESH_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_EXPIRE", "7"))

    # ── Google OAuth ──
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/oauth/google/callback"
    )


settings = Settings()
