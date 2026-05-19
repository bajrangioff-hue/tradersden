"""News route handler — validation, caching, documentation."""

from datetime import datetime, timezone

from fastapi import APIRouter, Path, Request

from app.middleware.cache import cache
from app.middleware.rate_limiter import limiter
from app.schemas.news_schema import NewsArticle, NewsResponse
from app.services.live_news_service import live_news_service
from app.services.news_service import get_stock_news
from app.utils.response import success_response
from app.validators.symbol_validator import validate_symbol

router = APIRouter(tags=["news"])


# ── Live feed routes (must come before /news/{symbol} to avoid path collision) ──

@router.get(
    "/news/live",
    summary="Live aggregated news feed",
    description="Aggregates financial news from 10+ RSS sources (Reuters, CNBC, MarketWatch, etc.). "
                "Deduplicated, sorted newest-first, cached for 60 seconds.",
    responses={
        200: {"description": "Live news feed"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("30/minute")
async def live_news_endpoint(
    request: Request,
) -> dict:
    """Fetch live aggregated news from all RSS sources.

    Returns:
        Dict with articles, count, sources, last_updated.
    """
    cache_key = "news:live"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    articles = live_news_service.fetch_all_news()
    source_names = sorted({a["source"] for a in articles})

    result = success_response({
        "articles": articles,
        "count": len(articles),
        "sources": len(source_names),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    })

    cache.set(cache_key, result, ttl_seconds=60)
    return result


@router.get(
    "/news/live/{symbol}",
    summary="Live news filtered by symbol",
    description="Filters the live aggregated feed for articles matching a given symbol or related keywords. "
                "Cached for 60 seconds.",
    responses={
        200: {"description": "Symbol-filtered news"},
        400: {"description": "Invalid symbol format"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("30/minute")
async def live_news_symbol_endpoint(
    request: Request,
    symbol: str = Path(
        ...,
        min_length=1,
        max_length=15,
        description="Ticker symbol to filter news for",
        examples=["SPY", "AAPL", "BTC-USD"],
    ),
) -> dict:
    """Fetch live news filtered for a specific symbol.

    Args:
        request: FastAPI request object.
        symbol: Ticker symbol.

    Returns:
        Dict with articles, count, sources, last_updated.
    """
    validate_symbol(symbol)

    cache_key = f"news:live:{symbol}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    articles = live_news_service.fetch_news_for_symbol(symbol)
    source_names = sorted({a["source"] for a in articles})

    result = success_response({
        "articles": articles,
        "count": len(articles),
        "sources": len(source_names),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    })

    cache.set(cache_key, result, ttl_seconds=60)
    return result


# ── Legacy symbol-specific news route ──

@router.get(
    "/news/{symbol}",
    response_model=NewsResponse,
    summary="Get stock news for a symbol",
    description="Fetch recent news articles for a given symbol with sentiment classification. "
                "Results cached for 10 minutes.",
    responses={
        200: {"description": "News articles retrieved"},
        400: {"description": "Invalid symbol format"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("50/minute")
async def news_endpoint(
    request: Request,
    symbol: str = Path(
        ...,
        min_length=2,
        max_length=15,
        description="Ticker symbol to fetch news for",
        examples=["SPY", "AAPL", "BTC-USD"],
    ),
) -> NewsResponse:
    """Fetch latest news for a financial symbol.

    Args:
        request: FastAPI request object (injected by router).
        symbol: Ticker symbol.

    Returns:
        NewsResponse with articles and metadata.
    """
    validate_symbol(symbol)

    cached = cache.get(f"news:{symbol}")
    if cached is not None:
        return NewsResponse(status="success", data={
            "symbol": symbol,
            "articles": cached,
            "count": len(cached),
        })

    articles_data = get_stock_news(symbol)
    articles = [NewsArticle(
        headline=a.get("title", ""),
        source=a.get("publisher", ""),
        url=a.get("link"),
        summary=a.get("summary"),
        sentiment=a.get("sentiment"),
    ) for a in articles_data]

    articles_serialized = [a.model_dump() for a in articles]
    cache.set(f"news:{symbol}", articles_serialized, ttl_seconds=600)

    return NewsResponse(status="success", data={
        "symbol": symbol,
        "articles": articles_serialized,
        "count": len(articles_serialized),
    })
