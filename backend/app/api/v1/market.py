"""Market data endpoints — live prices and streaming."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from app.services.market_stream import get_live_price, get_live_prices, live_price_generator

logger = logging.getLogger("tradepro.api.market")
router = APIRouter(tags=["market"])


@router.get("/market/prices")
async def market_prices(
    request: Request,
    symbols: str = Query("", description="Comma-separated symbol list (empty = all)"),
) -> dict[str, Any]:
    """Get live prices for all tracked symbols or a subset."""
    prices = await get_live_prices()
    if symbols:
        requested = {s.strip().upper() for s in symbols.split(",") if s.strip()}
        prices = {k: v for k, v in prices.items() if k in requested}
    return {"status": "success", "data": prices, "count": len(prices)}


@router.get("/market/price/{symbol}")
async def market_price(request: Request, symbol: str) -> dict[str, Any]:
    """Get live price for a single symbol."""
    price = await get_live_price(symbol)
    if price is None:
        return {"status": "error", "data": None, "message": f"No data for '{symbol}'"}
    return {"status": "success", "data": price}


@router.get("/market/stream")
async def market_stream(request: Request):
    """SSE endpoint for live price streaming."""
    async def event_generator():
        async for snapshot in live_price_generator():
            yield f"data: {json.dumps(snapshot)}\n\n"
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
