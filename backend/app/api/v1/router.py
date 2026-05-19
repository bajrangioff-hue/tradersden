"""Top-level v1 router aggregating all sub-routers."""

from fastapi import APIRouter

from app.api.v1 import analyze, auth, calendar, confluence, health, market, news, scanner, setups, tags, trades, users

router = APIRouter(prefix="/api/v1")
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(trades.router)
router.include_router(tags.router)
router.include_router(confluence.router)
router.include_router(setups.router)
router.include_router(analyze.router)
router.include_router(calendar.router)
router.include_router(news.router)
router.include_router(scanner.router)
router.include_router(market.router)
