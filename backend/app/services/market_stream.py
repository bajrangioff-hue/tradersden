"""Live market data service — polls yfinance and caches snapshots."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import yfinance as yf

logger = logging.getLogger("tradepro.market_stream")

LIVE_SYMBOLS = [
    "SPY", "QQQ", "IWM", "DIA",
    "ES=F", "NQ=F", "YM=F", "RTY=F",
    "MNQ=F", "MES=F", "MYM=F", "M2K=F",
    "GC=F", "SI=F", "CL=F", "NG=F",
    "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X",
    "BTC-USD", "ETH-USD", "SOL-USD",
]

_cache: dict[str, dict[str, Any]] = {}
_last_fetch: float = 0
_fetch_lock = asyncio.Lock()
CACHE_TTL = 8.0


def _get_symbol_category(sym: str) -> str:
    if sym.endswith("=F") or "=F" in sym:
        if sym.startswith("M"):
            return "micro"
        return "futures"
    if sym.endswith("=X"):
        return "forex"
    if sym.endswith("-USD"):
        return "crypto"
    return "stocks"


async def _fetch_snapshot(symbol: str) -> dict[str, Any] | None:
    try:
        loop = asyncio.get_event_loop()
        ticker = yf.Ticker(symbol)
        hist = await loop.run_in_executor(None, lambda: ticker.history(period="2d", interval="1m"))
        if hist.empty:
            return None
        latest = hist.iloc[-1]
        prev_close = hist["Close"].iloc[-2] if len(hist) > 1 else latest["Close"]
        price = float(latest["Close"])
        prev = float(prev_close)
        change = price - prev
        pct = (change / prev) * 100 if prev else 0.0
        return {
            "s": symbol,
            "p": round(price, 2),
            "c": round(change, 2),
            "pc": round(pct, 2),
            "h": round(float(latest["High"]), 2),
            "l": round(float(latest["Low"]), 2),
            "v": int(latest["Volume"]) if "Volume" in latest else 0,
            "cat": _get_symbol_category(symbol),
            "t": time.time(),
        }
    except Exception as exc:
        logger.debug("Failed to fetch %s: %s", symbol, exc)
        return None


async def refresh_cache() -> None:
    global _last_fetch
    async with _fetch_lock:
        now = time.time()
        if now - _last_fetch < CACHE_TTL:
            return
        results = await asyncio.gather(
            *(_fetch_snapshot(s) for s in LIVE_SYMBOLS),
            return_exceptions=True,
        )
        for symbol, result in zip(LIVE_SYMBOLS, results):
            if isinstance(result, dict):
                _cache[symbol] = result
        _last_fetch = time.time()
        logger.debug("Refreshed %d/%d live prices", len(_cache), len(LIVE_SYMBOLS))


async def get_live_prices() -> dict[str, dict[str, Any]]:
    await refresh_cache()
    return dict(_cache)


async def get_live_price(symbol: str) -> dict[str, Any] | None:
    await refresh_cache()
    upper = symbol.upper()
    if upper in _cache:
        return _cache[upper]
    result = await _fetch_snapshot(upper)
    if result:
        _cache[upper] = result
    return result


async def live_price_generator():
    """Async generator for SSE streaming."""
    while True:
        await refresh_cache()
        yield dict(_cache)
        await asyncio.sleep(CACHE_TTL)
