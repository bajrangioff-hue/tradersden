"""Multi-source RSS news aggregator — Financial Juice style live feed."""

import email.utils
import logging
from datetime import datetime, timezone
from typing import Any
from xml.etree import ElementTree

import dateutil.parser
import requests

logger = logging.getLogger("tradepro.live_news")

SOURCES: list[dict[str, str]] = [
    {"name": "Reuters", "url": "https://feeds.reuters.com/reuters/businessNews", "category": "macro"},
    {"name": "CNBC", "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html", "category": "macro"},
    {"name": "MarketWatch", "url": "https://feeds.marketwatch.com/marketwatch/topstories/", "category": "stocks"},
    {"name": "Investing.com", "url": "https://www.investing.com/rss/news.rss", "category": "macro"},
    {"name": "FXStreet", "url": "https://www.fxstreet.com/rss/news", "category": "forex"},
    {"name": "SeekingAlpha", "url": "https://seekingalpha.com/feed.xml", "category": "stocks"},
    {"name": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex", "category": "macro"},
    {"name": "ForexLive", "url": "https://www.forexlive.com/feed/news", "category": "forex"},
    {"name": "ZeroHedge", "url": "https://feeds.feedburner.com/zerohedge/feed", "category": "macro"},
    {"name": "Bloomberg Markets", "url": "https://feeds.bloomberg.com/markets/news.rss", "category": "macro"},
]

_ATOM_NS = "http://www.w3.org/2005/Atom"

_SYMBOL_KEYWORDS: dict[str, list[str]] = {
    "SPY": ["spy", "s&p 500", "s&p", "sp 500"],
    "QQQ": ["qqq", "nasdaq", "nasdaq 100"],
    "AAPL": ["aapl", "apple inc", "apple stock", "iphone"],
    "TSLA": ["tsla", "tesla", "elon musk"],
    "NVDA": ["nvda", "nvidia"],
    "MSFT": ["msft", "microsoft"],
    "AMZN": ["amzn", "amazon"],
    "META": ["meta", "facebook", "instagram", "whatsapp"],
    "GOOGL": ["googl", "google", "alphabet"],
    "BTC-USD": ["bitcoin", "btc", "crypto"],
    "ETH-USD": ["ethereum", "eth"],
    "ES=F": ["s&p 500 futures", "es futures", "spx futures"],
    "NQ=F": ["nasdaq futures", "nq futures"],
    "GC=F": ["gold", "gold futures", "precious metals"],
    "CL=F": ["crude", "oil", "wti", "brent"],
    "EURUSD=X": ["eur/usd", "euro dollar", "euro"],
}

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def _time_ago(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    diff = now - dt
    secs = int(diff.total_seconds())
    if secs < 60:
        return "Just now"
    mins = secs // 60
    if mins < 60:
        return f"{mins}m ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    return f"{days}d ago"


def _parse_rss_date(raw: str | None) -> datetime:
    if not raw:
        return datetime.now(timezone.utc)
    raw = raw.strip()
    try:
        dt = dateutil.parser.parse(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        pass
    try:
        dt = email.utils.parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        pass
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%a, %d %b %Y %H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            continue
    return datetime.now(timezone.utc)


def _title_key(title: str) -> str:
    """Normalize a title for deduplication comparison."""
    return "".join(c.lower() for c in title if c.isalnum() or c.isspace()).strip()


def _is_duplicate(title: str, seen_titles: list[str]) -> bool:
    """Check if title is ~85% similar to any already seen title."""
    key = _title_key(title)
    words = set(key.split())
    if not words:
        return False
    for seen in seen_titles:
        seen_key = _title_key(seen)
        seen_words = set(seen_key.split())
        if not seen_words:
            continue
        overlap = len(words & seen_words)
        smaller = min(len(words), len(seen_words))
        if smaller > 0 and overlap / smaller >= 0.85:
            return True
    return False


def _extract_rss_item(item: Any, source: dict[str, str]) -> dict[str, Any] | None:
    try:
        title_el = item.find("title")
        link_el = item.find("link")
        pub_el = item.find("pubDate")
        desc_el = item.find("description")
        if title_el is None or title_el.text is None:
            return None
        title = title_el.text.strip()
        if not title:
            return None
        link = ""
        if link_el is not None:
            link = link_el.text or link_el.get("href", "")
        pub_raw = pub_el.text if pub_el is not None else None
        pub_dt = _parse_rss_date(pub_raw)
        desc = (desc_el.text or "").strip() if desc_el is not None else ""
        return {
            "title": title,
            "link": link,
            "url": link,
            "pubDate": pub_dt.isoformat(),
            "datetime": pub_dt.isoformat(),
            "description": desc,
            "source": source["name"],
            "category": source["category"],
            "time_ago": _time_ago(pub_dt),
        }
    except Exception:
        return None


def _extract_atom_entry(entry: Any, source: dict[str, str]) -> dict[str, Any] | None:
    try:
        title_el = entry.find(f"{{{_ATOM_NS}}}title")
        link_el = entry.find(f"{{{_ATOM_NS}}}link")
        pub_el = entry.find(f"{{{_ATOM_NS}}}published") or entry.find(f"{{{_ATOM_NS}}}updated")
        summary_el = entry.find(f"{{{_ATOM_NS}}}summary")
        if title_el is None or title_el.text is None:
            return None
        title = title_el.text.strip()
        if not title:
            return None
        link = ""
        if link_el is not None:
            link = link_el.get("href", "") or link_el.text or ""
        pub_raw = pub_el.text if pub_el is not None else None
        pub_dt = _parse_rss_date(pub_raw)
        summary = (summary_el.text or "").strip() if summary_el is not None else ""
        return {
            "title": title,
            "link": link,
            "url": link,
            "pubDate": pub_dt.isoformat(),
            "datetime": pub_dt.isoformat(),
            "description": summary,
            "source": source["name"],
            "category": source["category"],
            "time_ago": _time_ago(pub_dt),
        }
    except Exception:
        return None


def _fetch_feed(source: dict[str, str]) -> list[dict[str, Any]]:
    """Fetch and parse a single RSS/Atom feed. Returns list of articles or empty list on failure."""
    try:
        resp = requests.get(source["url"], timeout=6, headers=_HEADERS)
        if resp.status_code == 403:
            logger.warning("[live_news] %s returned 403 — skipping", source["name"])
            return []
        resp.raise_for_status()
        root = ElementTree.fromstring(resp.content)
    except requests.exceptions.Timeout:
        logger.warning("[live_news] %s timed out (6s) — skipping", source["name"])
        return []
    except requests.exceptions.RequestException as exc:
        logger.warning("[live_news] %s request failed: %s — skipping", source["name"], exc)
        return []
    except ElementTree.ParseError as exc:
        logger.warning("[live_news] %s XML parse error: %s — skipping", source["name"], exc)
        return []
    except Exception as exc:
        logger.warning("[live_news] %s unexpected error: %s — skipping", source["name"], exc)
        return []

    articles: list[dict[str, Any]] = []

    rss_items = root.findall(".//item")
    for item in rss_items:
        art = _extract_rss_item(item, source)
        if art is not None:
            articles.append(art)

    atom_entries = root.findall(f".//{{{_ATOM_NS}}}entry")
    for entry in atom_entries:
        art = _extract_atom_entry(entry, source)
        if art is not None:
            articles.append(art)

    if articles:
        logger.info("[live_news] %s loaded %d articles", source["name"], len(articles))
    else:
        logger.warning("[live_news] %s returned 0 articles", source["name"])

    return articles


class LiveNewsService:
    """Aggregates financial news from multiple RSS sources."""

    def fetch_all_news(self) -> list[dict[str, Any]]:
        """Fetch and aggregate news from all sources.

        Returns:
            Up to 50 deduplicated articles sorted newest-first.
        """
        all_articles: list[dict[str, Any]] = []
        seen_titles: list[str] = []

        for source in SOURCES:
            feed_articles = _fetch_feed(source)
            for art in feed_articles:
                if _is_duplicate(art["title"], seen_titles):
                    continue
                seen_titles.append(art["title"])
                all_articles.append(art)

        all_articles.sort(key=lambda a: a.get("datetime", ""), reverse=True)
        return all_articles[:50]

    def fetch_news_for_symbol(self, symbol: str) -> list[dict[str, Any]]:
        """Fetch news relevant to a specific symbol.

        Args:
            symbol: Ticker symbol (e.g. 'SPY', 'AAPL').

        Returns:
            Up to 20 articles that mention the symbol or related keywords.
        """
        all_news = self.fetch_all_news()
        keywords = _SYMBOL_KEYWORDS.get(symbol.upper(), [symbol.lower()])

        matched: list[dict[str, Any]] = []
        for art in all_news:
            text = (art["title"] + " " + art.get("description", "")).lower()
            if any(kw.lower() in text for kw in keywords):
                matched.append(art)
            if len(matched) >= 20:
                break

        return matched


live_news_service = LiveNewsService()
