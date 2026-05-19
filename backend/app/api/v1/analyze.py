"""Analyze route handler — enterprise-grade validation, caching, error handling."""

from fastapi import APIRouter, Path, Request
from app.validators.symbol_validator import validate_symbol, InvalidSymbolError as SymError
from app.exceptions.custom_exceptions import InvalidSymbolError, SymbolNotFoundError, DataFetchError
from app.middleware.cache import cache
from app.middleware.rate_limiter import limiter
from app.schemas.analyzer_schema import AnalyzeResponse
from app.services.analysis_service import analyze_symbol
from app.services.market_data import fetch_data
from app.utils.response import success_response

router = APIRouter(tags=["analyzer"])


@router.get(
    "/analyze/{symbol}",
    response_model=AnalyzeResponse,
    summary="Analyze symbol delivery quality",
    description="Evaluates delivery, targets, retracement, and checklist for any supported symbol. "
                "Returns a grade (A+, A, B, F) with detailed metrics.",
    responses={
        200: {"description": "Analysis completed successfully"},
        400: {"description": "Invalid symbol format or unsupported symbol"},
        404: {"description": "Market data not available for symbol"},
        429: {"description": "Rate limit exceeded"},
        503: {"description": "Data fetch failed, please retry"},
    },
)
@limiter.limit("100/minute")
async def analyze_symbol_endpoint(
    request: Request,
    symbol: str = Path(
        ...,
        min_length=2,
        max_length=15,
        description="Stock ticker, futures symbol, forex pair, or crypto (e.g. MNQ=F, EURUSD=X, BTC-USD)",
        examples=["SPY", "MNQ=F", "EURUSD=X", "BTC-USD"],
    ),
) -> AnalyzeResponse:
    """Run full institutional analysis on a financial symbol.

    Args:
        request: FastAPI request object (injected by router).
        symbol: Ticker symbol to analyze.

    Returns:
        AnalyzeResponse with grade, score, checklist, targets, and metrics.

    Raises:
        InvalidSymbolError: If symbol format is invalid or not whitelisted.
        SymbolNotFoundError: If market data cannot be retrieved.
        DataFetchError: If analysis pipeline fails.
    """
    validate_symbol(symbol)

    cached = cache.get(f"analyze:{symbol}")
    if cached is not None:
        return AnalyzeResponse(status="success", data=cached)

    try:
        df = fetch_data(symbol, interval="1h", period="1mo")
        if df.empty:
            raise SymbolNotFoundError(symbol)
    except (ValueError, SymError) as exc:
        raise SymbolNotFoundError(symbol) from exc

    try:
        result = analyze_symbol(symbol)
        cache.set(f"analyze:{symbol}", result, ttl_seconds=300)
        return AnalyzeResponse(status="success", data=result)
    except Exception as exc:
        raise DataFetchError(str(exc)) from exc
