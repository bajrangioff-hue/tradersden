"""Scanner route — parallel ICT analysis across multiple symbols."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Query, Request

from app.middleware.cache import cache
from app.middleware.rate_limiter import limiter
from app.services.analysis_service import analyze_symbol
from app.utils.response import success_response
from app.validators.symbol_validator import is_whitelisted

router = APIRouter(tags=["scanner"])

_DEFAULT_SYMBOLS = ["SPY", "QQQ", "MNQ=F", "ES=F", "NQ=F", "GC=F", "CL=F", "EURUSD=X", "BTC-USD", "AAPL"]


async def _run_analysis(symbol: str) -> dict[str, Any]:
    loop = asyncio.get_running_loop()
    try:
        result = await loop.run_in_executor(None, analyze_symbol, symbol)
        return {
            "symbol": result["symbol"],
            "grade": result.get("grade_letter", "F"),
            "score": result.get("confluence_score", 0),
            "direction": result.get("direction", "NEUTRAL"),
            "session": result.get("session", ""),
            "checks_passed": sum(1 for v in result.get("checklist", {}).values() if v.get("passed")),
            "no_trade": result.get("no_trade", False),
        }
    except Exception:
        return {"symbol": symbol, "grade": "F", "score": 0, "direction": "NEUTRAL", "session": "", "checks_passed": 0, "no_trade": True}


@router.get(
    "/scanner",
    summary="Multi-symbol market scanner",
    description="Runs ICT analysis on multiple symbols in parallel. Results cached for 5 minutes.",
    responses={200: {"description": "Scan results"}, 429: {"description": "Rate limit exceeded"}},
)
@limiter.limit("10/minute")
async def scanner_endpoint(
    request: Request,
    symbols: str = Query(default="", description="Comma-separated symbols (default: top 10)"),
    min_grade: str = Query(default="", description="Minimum grade filter: A+/A/B/F"),
) -> dict:
    cache_key = f"scanner:{symbols}:{min_grade}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()] if symbols else _DEFAULT_SYMBOLS
    sym_list = [s for s in sym_list if is_whitelisted(s)][:20]

    tasks = [_run_analysis(s) for s in sym_list]
    results = await asyncio.gather(*tasks)

    grade_order = {"A+": 0, "A": 1, "B": 2, "F": 3}
    results.sort(key=lambda r: grade_order.get(r.get("grade", "F"), 99))

    if min_grade:
        levels = {"A+": 0, "A": 1, "B": 2, "F": 3}
        min_level = levels.get(min_grade.upper(), 0)
        results = [r for r in results if levels.get(r.get("grade", "F"), 99) <= min_level]

    prime_setups = sum(1 for r in results if r.get("grade") in ("A+", "A"))

    result = success_response({
        "results": results,
        "scanned": len(results),
        "prime_setups": prime_setups,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    cache.set(cache_key, result, ttl_seconds=300)
    return result
