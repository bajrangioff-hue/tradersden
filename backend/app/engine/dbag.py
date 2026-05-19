"""DBAG (Day Before/After Gap) analysis."""

from typing import Any

import pandas as pd

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]


def analyze_dbag(
    df: pd.DataFrame,
    pwh: float,
    pwl: float,
    current_price: float,
) -> dict[str, Any]:
    """Analyze price position relative to previous week high/low.

    Args:
        df: DataFrame with 'close' and 'open' columns.
        pwh: Previous week high.
        pwl: Previous week low.
        current_price: Current market price.

    Returns:
        Dict with pwh, pwl, distance metrics, signal, and pattern data.
    """
    result: dict[str, Any] = {
        "pwh": pwh,
        "pwl": pwl,
        "pwh_distance_pct": round((current_price - pwh) / pwh * 100, 2),
        "pwl_distance_pct": round((current_price - pwl) / pwl * 100, 2),
        "above_pwh": current_price > pwh,
        "below_pwl": current_price < pwl,
        "signal": _determine_dbag_signal(current_price, pwh, pwl),
    }
    if df is not None and not df.empty:
        result["weekly_pattern"] = _analyze_weekly_pattern(df.tail(5))
        result["day_streak"] = _count_day_streak(df)
        result["dma_position"] = _dma_position(df)
    return result


def _determine_dbag_signal(price: float, pwh: float, pwl: float) -> str:
    """Classify the current price signal relative to PWH/PWL."""
    if price > pwh * 1.02:
        return "breakout_above_pwh"
    if price < pwl * 0.98:
        return "breakdown_below_pwl"
    if price > pwh:
        return "near_pwh_resistance"
    if price < pwl:
        return "near_pwl_support"
    range_pct = (price - pwl) / (pwh - pwl) * 100 if (pwh - pwl) > 0 else 50.0
    if range_pct > 70:
        return "approaching_pwh"
    if range_pct < 30:
        return "near_pwl"
    return "in_range"


def _analyze_weekly_pattern(df: pd.DataFrame) -> dict[str, Any]:
    """Analyze the weekly bullish/bearish streak pattern."""
    if df.empty or len(df) < 2:
        return {"pattern": "insufficient_data", "streak": 0}
    weekly_changes = [bool(row["close"] > row["open"]) for _, row in df.iterrows()]
    streak = 0
    for val in reversed(weekly_changes):
        if val:
            streak += 1
        else:
            break
    if streak >= 3:
        pattern = "bullish_streak"
    elif streak <= -3:
        pattern = "bearish_streak"
    else:
        pattern = "mixed"
    return {"pattern": pattern, "streak": streak}


def _count_day_streak(df: pd.DataFrame) -> dict[str, Any]:
    """Count consecutive up/down daily closes."""
    if df.empty or len(df) < 3:
        return {"streak": 0, "direction": "none"}
    closes = df["close"].values[-5:]
    changes = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    green_streak = 0
    red_streak = 0
    for c in reversed(changes):
        if c > 0:
            green_streak += 1
            red_streak = 0
        else:
            red_streak += 1
            green_streak = 0
    direction = "up" if green_streak > 0 else "down" if red_streak > 0 else "flat"
    return {"streak": max(green_streak, red_streak), "direction": direction}


def _dma_position(df: pd.DataFrame) -> dict[str, Any]:
    """Determine price position relative to DMAs."""
    close = float(df["close"].values[-1])
    dma_20 = float(pd.Series(df["close"].values).rolling(20).mean().iloc[-1])
    dma_50 = (
        float(pd.Series(df["close"].values).rolling(50).mean().iloc[-1])
        if len(df) >= 50
        else None
    )
    dma_200 = (
        float(pd.Series(df["close"].values).rolling(200).mean().iloc[-1])
        if len(df) >= 200
        else None
    )

    above_50 = dma_50 is None or close > dma_50
    above_200 = dma_200 is None or close > dma_200
    position: str
    if above_50 and above_200:
        position = "above_all"
    elif dma_50 is not None and dma_200 is not None:
        if close < dma_50 and close < dma_200:
            position = "below_all"
        elif close > dma_20:
            position = "short_term_bullish"
        else:
            position = "mixed"
    else:
        position = "mixed"

    return {
        "current_vs_20dma": round((close - dma_20) / dma_20 * 100, 2),
        "current_vs_50dma": round((close - dma_50) / dma_50 * 100, 2) if dma_50 else None,
        "current_vs_200dma": round((close - dma_200) / dma_200 * 100, 2) if dma_200 else None,
        "position": position,
    }
