"""Liquidity sweep detection and Fibonacci retracement calculations."""

from typing import Any

import numpy as np
import pandas as pd


def find_liquidity_sweep(df: pd.DataFrame) -> dict[str, Any]:
    """Detect if a liquidity sweep of recent swing high/low occurred.

    Args:
        df: DataFrame with 'High', 'Low' columns, at least 30 rows.

    Returns:
        Dict with passed, direction, and reason keys.
    """
    if len(df) < 30:
        return {"passed": False, "reason": "Not enough data"}
    highs = df["High"].values[-30:]
    lows = df["Low"].values[-30:]
    swing_high = float(np.max(highs[:-5]))
    swing_low = float(np.min(lows[:-5]))
    sweep_high = bool(highs[-1] > swing_high) and bool(highs[-2] > swing_high)
    sweep_low = bool(lows[-1] < swing_low) and bool(lows[-2] < swing_low)
    if sweep_high:
        return {"passed": True, "direction": "SELL", "reason": "Liquidity sweep of swing high"}
    if sweep_low:
        return {"passed": True, "direction": "BUY", "reason": "Liquidity sweep of swing low"}
    return {"passed": False, "reason": "No liquidity sweep detected"}


def compute_retracement(df: pd.DataFrame, level: float = 0.618) -> dict[str, Any]:
    """Compute Fibonacci retracement level and check if price has hit it.

    Args:
        df: DataFrame with 'High', 'Low', 'Close' columns, at least 10 rows.
        level: Fibonacci level to compute (default 0.618).

    Returns:
        Dict with fib_level, current_retrace, and hit_level keys.
    """
    if len(df) < 10:
        return {"fib_level": 0.0, "current_retrace": 0.0, "hit_level": False}
    highs = df["High"].values[-10:]
    lows = df["Low"].values[-10:]
    high = float(np.max(highs))
    low = float(np.min(lows))
    closes = df["Close"].values[-10:]
    current = float(closes[-1])
    fib_price = high - (high - low) * level
    hit = abs(current - fib_price) / fib_price < 0.02 if fib_price != 0 else False
    retrace_pct = (high - current) / (high - low) if high != low else 0.0
    return {
        "fib_level": round(fib_price, 2),
        "current_retrace": round(retrace_pct, 4),
        "hit_level": bool(hit),
    }
