"""Application configuration using environment variables."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _dotenv_path.exists():
    load_dotenv(dotenv_path=_dotenv_path, override=True)
else:
    load_dotenv(override=True)


class Settings:
    APP_TITLE: str = "TradePro Delivery System"
    APP_VERSION: str = "3.0.0"
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    DEBUG: bool = os.getenv("DEBUG", "True") == "True"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./tradepro.db")

    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "0"))
    DB_ECHO: bool = os.getenv("DB_ECHO", "0") == "1"

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_EXPIRE", "15"))
    JWT_REFRESH_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_EXPIRE", "7"))

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/oauth/google/callback"
    )

    YFINANCE_TIMEOUT: int = int(os.getenv("YFINANCE_TIMEOUT", "30"))
    CALENDAR_URL: str = os.getenv(
        "CALENDAR_URL",
        "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    )
    CALENDAR_TIMEOUT: int = int(os.getenv("CALENDAR_TIMEOUT", "15"))

    @property
    def CORS_ORIGINS(self) -> list[str]:
        raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
        return [o.strip() for o in raw.split(",")]


settings = Settings()
