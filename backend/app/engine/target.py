"""Target calculations and SMT divergence detection."""

from typing import Any

import numpy as np
import pandas as pd


def compute_targets(df: pd.DataFrame, direction: str) -> dict[str, Any]:
    """Compute ATR-based price targets for the given direction.

    Args:
        df: DataFrame with 'Close', 'High', 'Low' columns, at least 20 rows.
        direction: 'BULLISH' or 'BEARISH'.

    Returns:
        Dict with clear_targets, direction, entry, and targets list.
    """
    if len(df) < 20:
        return {"clear_targets": False, "targets": [], "direction": direction, "entry": None}
    closes = df["Close"].values
    highs = df["High"].values
    lows = df["Low"].values
    atr = float(np.mean(highs[-14:] - lows[-14:]))
    entry = float(closes[-1])
    if direction == "BULLISH":
        t1 = entry + atr * 0.5
        t2 = entry + atr * 1.0
        t3 = entry + atr * 1.618
    else:
        t1 = entry - atr * 0.5
        t2 = entry - atr * 1.0
        t3 = entry - atr * 1.618
    return {
        "clear_targets": True,
        "direction": direction,
        "entry": round(entry, 2),
        "targets": [
            {"level": 1, "price": round(t1, 2)},
            {"level": 2, "price": round(t2, 2)},
            {"level": 3, "price": round(t3, 2)},
        ],
    }


def compute_smt_divergence(df: pd.DataFrame, es_df: pd.DataFrame) -> dict[str, Any]:
    """Detect Smart Money Technique divergence between symbol and ES futures.

    Args:
        df: Symbol DataFrame with 'Close' column.
        es_df: ES futures DataFrame with 'Close' column.

    Returns:
        Dict with passed, direction, and reason keys.
    """
    if df is None or es_df is None or len(df) < 10 or len(es_df) < 10:
        return {"passed": False, "reason": "Insufficient data for SMT"}
    price_close = df["Close"].values[-10:]
    es_close = es_df["Close"].values[-10:]
    price_lower = float(price_close[-1]) < float(price_close[0])
    es_higher = float(es_close[-1]) > float(es_close[0])
    if price_lower and es_higher:
        return {"passed": True, "direction": "BULLISH", "reason": "SMT divergence bullish"}
    price_higher = float(price_close[-1]) > float(price_close[0])
    es_lower = float(es_close[-1]) < float(es_close[0])
    if price_higher and es_lower:
        return {"passed": True, "direction": "BEARISH", "reason": "SMT divergence bearish"}
    return {"passed": False, "reason": "No SMT divergence detected"}
