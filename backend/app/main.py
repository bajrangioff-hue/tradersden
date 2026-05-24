"""FastAPI application factory with full middleware stack."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.database import close_db, init_db
from app.exceptions.custom_exceptions import AppException
from app.middleware.error_handler import app_exception_handler
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limiter import limiter

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("tradepro.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting %s v%s", settings.APP_TITLE, settings.APP_VERSION)
    app.state.cors_origins = settings.CORS_ORIGINS
    app.state.limiter = limiter

    try:
        await init_db()
        logger.info("Database tables verified")
    except Exception:
        logger.warning("Database init skipped — DB unavailable")

    yield

    await close_db()
    logger.info("Shutting down %s", settings.APP_TITLE)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_TITLE,
        description="Institutional trading analysis framework — "
                    "evaluates delivery quality, price targets, retracements, "
                    "and provides a comprehensive checklist for stocks, futures, forex, and crypto.",
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    origins = settings.CORS_ORIGINS
    if origins == ["*"]:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        local = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
        ]
        merged = list(dict.fromkeys(origins + local))
        app.add_middleware(
            CORSMiddleware,
            allow_origins=merged,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.add_middleware(RequestLoggingMiddleware)

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_exception_handler(AppException, app_exception_handler)

    app.include_router(v1_router)
    return app


app = create_app()
