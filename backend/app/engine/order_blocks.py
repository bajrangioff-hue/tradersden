"""ICT Order Block engine — bullish/bearish OB, breaker blocks, OB quality, price at OB."""

from typing import Any

import numpy as np
import pandas as pd


def _avg_range(highs: np.ndarray, lows: np.ndarray, period: int = 14) -> float:
    if len(highs) < period:
        return float(np.mean(highs[-min(period, len(highs)):] - lows[-min(period, len(highs)):]))
    return float(np.mean(highs[-period:] - lows[-period:]))


def analyze_order_blocks(df: pd.DataFrame) -> dict[str, Any]:
    """Run full ICT Order Block analysis.

    Args:
        df: DataFrame with Open, High, Low, Close columns (at least 30 rows).

    Returns:
        Dict with bullish_ob, bearish_ob, breaker, ob_quality, price_at_ob.
    """
    empty: dict[str, Any] = {
        "bullish_ob": {"high": 0.0, "low": 0.0, "index": -1, "valid": False, "mitigated": True},
        "bearish_ob": {"high": 0.0, "low": 0.0, "index": -1, "valid": False, "mitigated": True},
        "breaker_detected": False, "breaker_type": "none", "breaker_level": 0.0,
        "ob_quality": "none",
        "at_order_block": False, "ob_type": "none", "ob_distance_pct": 0.0,
    }

    if len(df) < 30:
        return empty

    opens = df["Open"].values.astype(float)
    highs = df["High"].values.astype(float)
    lows = df["Low"].values.astype(float)
    closes = df["Close"].values.astype(float)

    avg_rng = _avg_range(highs, lows)
    displacement_min = avg_rng * 1.5
    price = float(closes[-1])

    bullish_ob: dict[str, Any] = {"high": 0.0, "low": 0.0, "index": -1, "valid": False, "mitigated": True}
    bearish_ob: dict[str, Any] = {"high": 0.0, "low": 0.0, "index": -1, "valid": False, "mitigated": True}

    for i in range(2, len(highs) - 1):
        candle_range = highs[i] - lows[i]
        if candle_range <= 0:
            continue

        is_bearish = closes[i] < opens[i]
        is_bullish = closes[i] > opens[i]

        next_range = highs[i + 1] - lows[i + 1]
        if next_range <= 0:
            continue

        if is_bearish and is_bullish:
            continue

        if is_bearish:
            displacement = closes[i + 1] - opens[i + 1]
            if displacement > displacement_min and displacement > 0:
                bearish_ob = {
                    "high": float(highs[i]), "low": float(lows[i]),
                    "index": int(i), "valid": True, "mitigated": False,
                }

        if is_bullish:
            displacement = opens[i + 1] - closes[i + 1]
            if displacement > displacement_min and displacement > 0:
                bullish_ob = {
                    "high": float(highs[i]), "low": float(lows[i]),
                    "index": int(i), "valid": True, "mitigated": False,
                }

    if bullish_ob["valid"] and bullish_ob["low"] <= price <= bullish_ob["high"]:
        bullish_ob["mitigated"] = True
    if bearish_ob["valid"] and bearish_ob["low"] <= price <= bearish_ob["high"]:
        bearish_ob["mitigated"] = True

    breaker_detected = False
    breaker_type: str = "none"
    breaker_level = 0.0

    if bullish_ob["mitigated"]:
        breaker_detected = True
        breaker_type = "bull"
        breaker_level = bullish_ob["low"]
    elif bearish_ob["mitigated"]:
        breaker_detected = True
        breaker_type = "bear"
        breaker_level = bearish_ob["high"]

    ob_quality: str = "none"
    if bullish_ob["valid"] or bearish_ob["valid"]:
        displ = 0.0
        if bullish_ob["valid"] and bullish_ob["index"] + 1 < len(closes):
            displ = abs(closes[bullish_ob["index"] + 1] - opens[bullish_ob["index"] + 1])
        elif bearish_ob["valid"] and bearish_ob["index"] + 1 < len(closes):
            displ = abs(closes[bearish_ob["index"] + 1] - opens[bearish_ob["index"] + 1])
        ob_quality = "strong" if displ > avg_rng * 2.0 else "weak"

    at_order_block = False
    ob_type: str = "none"
    ob_distance_pct = 0.0

    nearest_ob = None
    if bullish_ob["valid"] and not bullish_ob["mitigated"]:
        nearest_ob = ("bullish", bullish_ob)
    elif bearish_ob["valid"] and not bearish_ob["mitigated"]:
        nearest_ob = ("bearish", bearish_ob)

    if nearest_ob is not None:
        ob_low = nearest_ob[1]["low"]
        ob_high = nearest_ob[1]["high"]
        ob_mid = (ob_low + ob_high) / 2.0
        if abs(price - ob_mid) / max(ob_mid, 0.01) < 0.003:
            at_order_block = True
            ob_type = nearest_ob[0]
            ob_distance_pct = round(abs(price - ob_mid) / max(ob_mid, 0.01) * 100, 2)

    return {
        "bullish_ob": bullish_ob,
        "bearish_ob": bearish_ob,
        "breaker_detected": bool(breaker_detected),
        "breaker_type": breaker_type,
        "breaker_level": round(breaker_level, 2),
        "ob_quality": ob_quality,
        "at_order_block": bool(at_order_block),
        "ob_type": ob_type,
        "ob_distance_pct": round(ob_distance_pct, 4),
    }
