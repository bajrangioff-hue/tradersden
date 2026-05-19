"""ICT Liquidity engine — BSL/SSL levels, sweep detection, nearest target, draw on liquidity."""

from typing import Any

import numpy as np
import pandas as pd


_EQUAL_THRESHOLD = 0.0015


def analyze_liquidity(df: pd.DataFrame, pda: dict[str, Any] | None = None) -> dict[str, Any]:
    """Run full ICT Liquidity analysis.

    Args:
        df: DataFrame with High, Low, Close columns (at least 30 rows).
        pda: Optional PDA dict with yesterday_high, yesterday_low.

    Returns:
        Dict with bsl_levels, ssl_levels, sweep, nearest_liquidity, dol.
    """
    empty: dict[str, Any] = {
        "bsl_levels": [], "ssl_levels": [],
        "sweep_detected": False, "sweep_type": "none", "sweep_level": 0.0, "bars_ago": 0,
        "nearest_bsl": 0.0, "nearest_ssl": 0.0,
        "nearest_bsl_distance_pct": 0.0, "nearest_ssl_distance_pct": 0.0,
        "dol_level": 0.0, "dol_type": "none", "dol_distance_pct": 0.0, "dol_confirmed": False,
    }

    if len(df) < 20:
        return empty

    highs = df["High"].values.astype(float)
    lows = df["Low"].values.astype(float)
    closes = df["Close"].values.astype(float)
    price = float(closes[-1])

    bsl_levels: list[dict[str, Any]] = []
    ssl_levels: list[dict[str, Any]] = []

    for i in range(3, min(30, len(highs))):
        is_swing_high = bool(highs[i] == max(highs[i - 2:i + 3]))
        is_swing_low = bool(lows[i] == min(lows[i - 2:i + 3]))
        if is_swing_high:
            bsl_levels.append({"price": float(highs[i]), "type": "swing_high", "strength": "medium"})
        if is_swing_low:
            ssl_levels.append({"price": float(lows[i]), "type": "swing_low", "strength": "medium"})

    for i in range(1, min(20, len(highs))):
        for j in range(i + 1, min(i + 6, len(highs))):
            if abs(highs[-i] - highs[-j]) / max(highs[-i], 0.01) < _EQUAL_THRESHOLD:
                existing = any(abs(e["price"] - highs[-i]) / max(highs[-i], 0.01) < _EQUAL_THRESHOLD for e in bsl_levels)
                if not existing:
                    bsl_levels.append({"price": float(highs[-i]), "type": "equal_highs", "strength": "high"})
            if abs(lows[-i] - lows[-j]) / max(lows[-i], 0.01) < _EQUAL_THRESHOLD:
                existing = any(abs(e["price"] - lows[-i]) / max(lows[-i], 0.01) < _EQUAL_THRESHOLD for e in ssl_levels)
                if not existing:
                    ssl_levels.append({"price": float(lows[-i]), "type": "equal_lows", "strength": "high"})

    if pda:
        pdh = pda.get("yesterday_high", 0.0)
        pdl = pda.get("yesterday_low", 0.0)
        if pdh > 0:
            existing_pdh = any(abs(e["price"] - pdh) / max(pdh, 0.01) < _EQUAL_THRESHOLD for e in bsl_levels)
            if not existing_pdh:
                bsl_levels.append({"price": round(pdh, 2), "type": "pdh", "strength": "high"})
        if pdl > 0:
            existing_pdl = any(abs(e["price"] - pdl) / max(pdl, 0.01) < _EQUAL_THRESHOLD for e in ssl_levels)
            if not existing_pdl:
                ssl_levels.append({"price": round(pdl, 2), "type": "pdl", "strength": "high"})

    bsl_levels.sort(key=lambda x: x["price"])
    ssl_levels.sort(key=lambda x: x["price"], reverse=True)

    sweep_detected = False
    sweep_type: str = "none"
    sweep_level = 0.0
    bars_ago = 0

    for i in range(min(5, len(highs))):
        for bsl in bsl_levels:
            if float(highs[-(i + 1)]) > bsl["price"] * 1.001 and float(closes[-(i + 1)]) < bsl["price"]:
                sweep_detected = True
                sweep_type = "bsl"
                sweep_level = bsl["price"]
                bars_ago = i + 1
                break
        if sweep_detected:
            break

    if not sweep_detected:
        for i in range(min(5, len(lows))):
            for ssl in ssl_levels:
                if float(lows[-(i + 1)]) < ssl["price"] * 0.999 and float(closes[-(i + 1)]) > ssl["price"]:
                    sweep_detected = True
                    sweep_type = "ssl"
                    sweep_level = ssl["price"]
                    bars_ago = i + 1
                    break
            if sweep_detected:
                break

    nearest_bsl = 0.0
    nearest_ssl = 0.0
    nearest_bsl_distance_pct = 0.0
    nearest_ssl_distance_pct = 0.0

    for bsl in bsl_levels:
        if bsl["price"] > price:
            nearest_bsl = bsl["price"]
            nearest_bsl_distance_pct = round((nearest_bsl - price) / price * 100, 2)
            break

    for ssl in ssl_levels:
        if ssl["price"] < price:
            nearest_ssl = ssl["price"]
            nearest_ssl_distance_pct = round((price - nearest_ssl) / price * 100, 2)
            break

    dol_level = 0.0
    dol_type: str = "none"
    dol_distance_pct = 0.0
    dol_confirmed = False

    is_bullish_bias = (bos if (bos := _detect_bias_from_data(highs, lows)) == "bullish" else False)
    if is_bullish_bias and nearest_bsl > 0:
        dol_level = nearest_bsl
        dol_type = "bsl"
        dol_distance_pct = nearest_bsl_distance_pct
        dol_confirmed = nearest_bsl_distance_pct < 5.0
    elif not is_bullish_bias and nearest_ssl > 0:
        dol_level = nearest_ssl
        dol_type = "ssl"
        dol_distance_pct = nearest_ssl_distance_pct
        dol_confirmed = nearest_ssl_distance_pct < 5.0

    return {
        "bsl_levels": bsl_levels[-10:] if len(bsl_levels) > 10 else bsl_levels,
        "ssl_levels": ssl_levels[-10:] if len(ssl_levels) > 10 else ssl_levels,
        "sweep_detected": bool(sweep_detected),
        "sweep_type": sweep_type,
        "sweep_level": round(sweep_level, 2),
        "bars_ago": int(bars_ago),
        "nearest_bsl": round(nearest_bsl, 2),
        "nearest_ssl": round(nearest_ssl, 2),
        "nearest_bsl_distance_pct": round(nearest_bsl_distance_pct, 2),
        "nearest_ssl_distance_pct": round(nearest_ssl_distance_pct, 2),
        "dol_level": round(dol_level, 2),
        "dol_type": dol_type,
        "dol_distance_pct": round(dol_distance_pct, 2),
        "dol_confirmed": bool(dol_confirmed),
    }


def _detect_bias_from_data(highs: np.ndarray, lows: np.ndarray) -> str:
    if len(highs) < 10:
        return "ranging"
    recent_highs = highs[-5:]
    recent_lows = lows[-5:]
    hh = all(recent_highs[i] > recent_highs[i - 1] for i in range(1, len(recent_highs)))
    hl = all(recent_lows[i] > recent_lows[i - 1] for i in range(1, len(recent_lows)))
    lh = all(recent_highs[i] < recent_highs[i - 1] for i in range(1, len(recent_highs)))
    ll = all(recent_lows[i] < recent_lows[i - 1] for i in range(1, len(recent_lows)))
    if hh and hl:
        return "bullish"
    if lh and ll:
        return "bearish"
    return "ranging"
