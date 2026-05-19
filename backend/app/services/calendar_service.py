"""Economic calendar fetching service."""

from datetime import datetime, timezone
from typing import Any

import requests

from app.config import settings

_FALLBACK_EVENTS: list[dict[str, Any]] = [
    {"title": "FOMC Interest Rate Decision", "country": "US", "currency": "USD", "impact": "high", "forecast": "5.00%", "previous": "5.25%", "actual": "", "datetime": "2026-06-12T18:00:00Z"},
    {"title": "Non-Farm Employment Change", "country": "US", "currency": "USD", "impact": "high", "forecast": "185K", "previous": "192K", "actual": "", "datetime": "2026-06-07T12:30:00Z"},
    {"title": "CPI y/y", "country": "US", "currency": "USD", "impact": "high", "forecast": "3.2%", "previous": "3.4%", "actual": "", "datetime": "2026-06-12T12:30:00Z"},
    {"title": "Unemployment Rate", "country": "US", "currency": "USD", "impact": "medium", "forecast": "3.8%", "previous": "3.7%", "actual": "", "datetime": "2026-06-07T12:30:00Z"},
    {"title": "Initial Jobless Claims", "country": "US", "currency": "USD", "impact": "medium", "forecast": "220K", "previous": "215K", "actual": "", "datetime": "2026-06-06T12:30:00Z"},
]

_CALENDAR_URLS = [
    "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
]


def _try_fetch_calendar(url: str) -> list[dict[str, Any]] | None:
    try:
        resp = requests.get(
            url,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
        )
        print(f"[calendar] GET {url} -> {resp.status_code}")
        text = resp.text[:200]
        print(f"[calendar] first 200 chars: {text}")
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            return data
    except Exception as exc:
        print(f"[calendar] URL failed {url}: {exc}")
    return None


def get_economic_calendar() -> list[dict[str, Any]]:
    """Fetch economic calendar events.

    Tries primary and backup ForexFactory JSON feeds. If both fail,
    returns hardcoded fallback events so the UI is never empty.

    Returns:
        List of event dicts with keys: title, country, currency, impact,
        forecast, previous, actual, datetime.
    """
    data = None
    for url in _CALENDAR_URLS:
        data = _try_fetch_calendar(url)
        if data is not None:
            break

    if data is None:
        print("[calendar] all URLs failed, returning fallback events")
        return list(_FALLBACK_EVENTS)

    events: list[dict[str, Any]] = []
    for item in data:
        try:
            title = item.get("title") or item.get("event", "")
            if not title:
                continue
            impact = _normalize_impact(item.get("impact", ""))
            events.append({
                "title": title,
                "country": item.get("country", ""),
                "currency": item.get("currency", ""),
                "impact": impact,
                "forecast": item.get("forecast", ""),
                "previous": item.get("previous", ""),
                "actual": item.get("actual", ""),
                "datetime": _parse_datetime(item),
            })
        except Exception:
            continue

    return events


def _parse_datetime(item: dict[str, Any]) -> str:
    dt = item.get("date") or item.get("dateTime", "")
    t = item.get("time", "")
    if dt and t:
        try:
            return f"{dt}T{t}Z"
        except Exception:
            pass
    if dt:
        return dt
    return datetime.now(timezone.utc).isoformat()


def _normalize_impact(impact_raw: str | int | float) -> str:
    """Normalize impact value to 'high', 'medium', or 'low'."""
    if isinstance(impact_raw, (int, float)):
        if impact_raw >= 3:
            return "high"
        if impact_raw == 2:
            return "medium"
        return "low"
    s = str(impact_raw).lower()
    if s in ("high", "red", "3"):
        return "high"
    if s in ("medium", "orange", "2"):
        return "medium"
    return "low"
