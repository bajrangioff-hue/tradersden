"""Calendar route handler — filtering, caching, documentation."""

from typing import Optional

from fastapi import APIRouter, Query, Request

from app.middleware.cache import cache
from app.middleware.rate_limiter import limiter
from app.schemas.calendar_schema import CalendarEvent, CalendarEventList
from app.services.calendar_service import get_economic_calendar
from app.utils.response import success_response

router = APIRouter(tags=["calendar"])


@router.get(
    "/calendar",
    summary="Get economic calendar events",
    description="Fetch economic calendar events with optional filtering by impact and currency. "
                "Results cached server-side for 30 minutes.",
    responses={
        200: {"description": "Calendar events retrieved"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("30/minute")
async def calendar_endpoint(
    request: Request,
    impact: Optional[list[str]] = Query(
        None,
        description="Filter by impact level(s)",
        examples=[["high", "medium"]],
    ),
    currency: Optional[list[str]] = Query(
        None,
        description="Filter by currency code(s)",
        examples=[["USD", "EUR"]],
    ),
    sort: str = Query(
        "datetime",
        description="Sort field: 'datetime' or 'impact'",
        pattern="^(datetime|impact)$",
    ),
) -> dict:
    """Fetch and optionally filter economic calendar events.

    Args:
        request: FastAPI request object (injected by router).
        impact: Optional list of impact levels to include.
        currency: Optional list of currency codes to include.
        sort: Sort field ('datetime' or 'impact').

    Returns:
        Standardized success response with events list and count.
    """
    cached = cache.get("calendar:all")
    if cached is not None:
        events_data = cached
    else:
        events_data = get_economic_calendar()
        cache.set("calendar:all", events_data, ttl_seconds=1800)

    events = [CalendarEvent(**ev) for ev in events_data]

    if impact:
        impact_set = {i.lower() for i in impact}
        events = [e for e in events if e.impact.lower() in impact_set]
    if currency:
        currency_set = {c.upper() for c in currency}
        events = [e for e in events if e.currency.upper() in currency_set]

    if sort == "impact":
        order = {"high": 0, "medium": 1, "low": 2}
        events = sorted(events, key=lambda e: order.get(e.impact.lower(), 999))

    return success_response({
        "events": [e.model_dump() for e in events],
        "count": len(events),
    })
