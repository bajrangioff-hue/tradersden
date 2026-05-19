"""Stock news fetching service via Yahoo Finance RSS."""

from datetime import datetime, timezone
from typing import Any
from xml.etree import ElementTree

import requests

_RSS_URL = "https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"


def _parse_rss_date(raw: str) -> str:
    if not raw:
        return datetime.now(timezone.utc).isoformat()
    raw = raw.strip()
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except (ValueError, TypeError):
            continue
    return raw


def _classify_sentiment(title: str) -> str:
    lower = title.lower()
    positive = {"surge", "rally", "bullish", "up", "gain", "positive", "beat", "upgrade"}
    negative = {"drop", "fall", "bearish", "down", "loss", "negative", "miss", "downgrade", "crash", "decline"}
    if any(w in lower for w in positive):
        return "positive"
    if any(w in lower for w in negative):
        return "negative"
    return "neutral"


def get_stock_news(symbol: str) -> list[dict[str, Any]]:
    """Fetch stock news for a given symbol via Yahoo Finance RSS.

    Args:
        symbol: Ticker symbol (e.g. 'SPY', 'AAPL').

    Returns:
        List of news article dicts. Empty list if the feed is unavailable.
    """
    try:
        url = _RSS_URL.format(symbol=symbol)
        resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ElementTree.fromstring(resp.content)
    except Exception:
        return []

    results: list[dict[str, Any]] = []
    items = root.findall(".//item")
    for item in items:
        try:
            title_el = item.find("title")
            link_el = item.find("link")
            pub_el = item.find("pubDate")
            desc_el = item.find("description")
            if title_el is None or title_el.text is None:
                continue
            title = title_el.text.strip()
            if not title:
                continue
            link = ""
            if link_el is not None:
                link = link_el.text or link_el.get("href", "")
            pub_raw = pub_el.text if pub_el is not None else ""
            dt = _parse_rss_date(pub_raw)
            summary = (desc_el.text or "").strip() if desc_el is not None else ""
            results.append({
                "title": title,
                "publisher": "Yahoo Finance",
                "link": link,
                "url": link,
                "summary": summary,
                "sentiment": _classify_sentiment(title),
                "datetime": dt,
                "pubDate": dt,
            })
        except Exception:
            continue

    return results[:15]
