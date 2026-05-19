"""Market data fetching via yfinance."""

from typing import Any

import pandas as pd
import yfinance as yf

from app.config import settings


def fetch_data(symbol: str, interval: str = "1h", period: str = "1mo") -> pd.DataFrame:
    """Fetch historical OHLCV data for a symbol.

    Args:
        symbol: Ticker symbol (e.g. 'SPY', 'ES=F').
        interval: Bar interval (e.g. '1h', '1d', '15m').
        period: Lookback period (e.g. '1mo', '3mo', '1wk').

    Returns:
        DataFrame with columns: Open, High, Low, Close, Volume.

    Raises:
        ValueError: If no data is returned for the symbol.
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(interval=interval, period=period)
    if df.empty:
        raise ValueError(f"No data returned for symbol '{symbol}'")
    return df


def fetch_htf_data(symbol: str, interval: str = "1d", period: str = "3mo") -> pd.DataFrame:
    """Fetch higher-timeframe OHLCV data for a symbol.

    Args:
        symbol: Ticker symbol.
        interval: Bar interval (default '1d').
        period: Lookback period (default '3mo').

    Returns:
        DataFrame with OHLCV columns.

    Raises:
        ValueError: If no data is returned.
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(interval=interval, period=period)
    if df.empty:
        raise ValueError(f"No HTF data for '{symbol}'")
    return df


def fetch_pda(symbol: str) -> dict[str, Any]:
    """Fetch previous day's high, low, and close (PDA).

    Args:
        symbol: Ticker symbol.

    Returns:
        Dict with yesterday_high, yesterday_low, yesterday_close.
    """
    df = fetch_htf_data(symbol, interval="1d", period="5d")
    if len(df) < 2:
        return {"yesterday_high": 0.0, "yesterday_low": 0.0, "yesterday_close": 0.0}
    prev = df.iloc[-2]
    return {
        "yesterday_high": round(float(prev["High"]), 2),
        "yesterday_low": round(float(prev["Low"]), 2),
        "yesterday_close": round(float(prev["Close"]), 2),
    }
