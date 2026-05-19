"""ICT Market Structure engine — swing points, BOS, CHoCH, trend bias, inducement."""

from typing import Any

import numpy as np
import pandas as pd


_SWING_LOOKBACK = 2


def _detect_swings(highs: np.ndarray, lows: np.ndarray) -> tuple[list[int], list[int]]:
    """Find swing high and low indices using a 5-bar pattern (2 left, 2 right confirmed).

    Args:
        highs: Array of high prices.
        lows: Array of low prices.

    Returns:
        Tuple of (swing_high_indices, swing_low_indices).
    """
    swing_highs: list[int] = []
    swing_lows: list[int] = []
    n = len(highs)
    for i in range(_SWING_LOOKBACK, n - _SWING_LOOKBACK):
        if highs[i] == max(highs[i - _SWING_LOOKBACK:i + _SWING_LOOKBACK + 1]):
            if swing_highs and abs(i - swing_highs[-1]) < 3:
                if highs[i] > highs[swing_highs[-1]]:
                    swing_highs[-1] = i
            else:
                swing_highs.append(i)
        if lows[i] == min(lows[i - _SWING_LOOKBACK:i + _SWING_LOOKBACK + 1]):
            if swing_lows and abs(i - swing_lows[-1]) < 3:
                if lows[i] < lows[swing_lows[-1]]:
                    swing_lows[-1] = i
            else:
                swing_lows.append(i)
    return swing_highs, swing_lows


def analyze_market_structure(df: pd.DataFrame) -> dict[str, Any]:
    """Run full ICT market structure analysis on a DataFrame.

    Args:
        df: DataFrame with Open, High, Low, Close columns (at least 20 rows).

    Returns:
        Dict with swing_highs, swing_lows, bos, choch, bias, inducement.
    """
    if len(df) < 20:
        return {
            "swing_highs": [], "swing_lows": [],
            "bos_detected": False, "bos_direction": "none", "bos_level": 0.0, "bos_confirmed": False,
            "choch_detected": False, "choch_direction": "none", "choch_level": 0.0,
            "bias": "ranging", "higher_highs": False, "higher_lows": False,
            "lower_highs": False, "lower_lows": False,
            "inducement_detected": False, "inducement_level": None,
        }

    highs = df["High"].values.astype(float)
    lows = df["Low"].values.astype(float)
    closes = df["Close"].values.astype(float)

    swing_high_idx, swing_low_idx = _detect_swings(highs, lows)
    swing_highs = [{"index": int(i), "price": float(highs[i])} for i in swing_high_idx]
    swing_lows = [{"index": int(i), "price": float(lows[i])} for i in swing_low_idx]

    bos_detected = False
    bos_direction: str = "none"
    bos_level = 0.0
    bos_confirmed = False

    if len(swing_high_idx) >= 2:
        last_sh = swing_high_idx[-2]
        if len(closes) > last_sh and float(closes[-1]) > float(highs[last_sh]):
            bos_detected = True
            bos_direction = "bull"
            bos_level = float(highs[last_sh])
            bos_confirmed = True

    if not bos_detected and len(swing_low_idx) >= 2:
        last_sl = swing_low_idx[-2]
        if len(closes) > last_sl and float(closes[-1]) < float(lows[last_sl]):
            bos_detected = True
            bos_direction = "bear"
            bos_level = float(lows[last_sl])
            bos_confirmed = True

    choch_detected = False
    choch_direction: str = "none"
    choch_level = 0.0

    if len(swing_high_idx) >= 2 and len(swing_low_idx) >= 2:
        recent_sh = swing_high_idx[-1]
        recent_sl = swing_low_idx[-1]
        prev_sh_idx = swing_high_idx[-2] if len(swing_high_idx) >= 2 else None
        prev_sl_idx = swing_low_idx[-2] if len(swing_low_idx) >= 2 else None

        if prev_sh_idx is not None:
            in_downtrend = float(lows[recent_sl]) < float(lows[prev_sl_idx]) if prev_sl_idx is not None else False
            if in_downtrend and float(closes[-1]) > float(highs[recent_sh]):
                choch_detected = True
                choch_direction = "bull"
                choch_level = float(highs[recent_sh])

        if not choch_detected and prev_sl_idx is not None:
            in_uptrend = float(highs[recent_sh]) > float(highs[prev_sh_idx]) if prev_sh_idx is not None else False
            if in_uptrend and float(closes[-1]) < float(lows[recent_sl]):
                choch_detected = True
                choch_direction = "bear"
                choch_level = float(lows[recent_sl])

    higher_highs = False
    higher_lows = False
    lower_highs = False
    lower_lows = False
    bias: str = "ranging"

    if len(swing_high_idx) >= 3 and len(swing_low_idx) >= 3:
        hh = all(highs[swing_high_idx[i]] > highs[swing_high_idx[i - 1]] for i in range(-2, 0))
        hl = all(lows[swing_low_idx[i]] > lows[swing_low_idx[i - 1]] for i in range(-2, 0))
        lh = all(highs[swing_high_idx[i]] < highs[swing_high_idx[i - 1]] for i in range(-2, 0))
        ll = all(lows[swing_low_idx[i]] < lows[swing_low_idx[i - 1]] for i in range(-2, 0))

        higher_highs = bool(hh)
        higher_lows = bool(hl)
        lower_highs = bool(lh)
        lower_lows = bool(ll)

        if hh and hl:
            bias = "bullish"
        elif lh and ll:
            bias = "bearish"
        else:
            bias = "ranging"

    inducement_detected = False
    inducement_level: float | None = None
    price = float(closes[-1])
    for i in range(1, min(15, len(highs))):
        for j in range(i + 1, min(i + 5, len(highs))):
            if abs(highs[-i] - highs[-j]) / max(highs[-i], 0.01) < 0.002:
                if price < highs[-i] * 0.995:
                    inducement_detected = True
                    inducement_level = float(highs[-i])
                    break
            if abs(lows[-i] - lows[-j]) / max(lows[-i], 0.01) < 0.002:
                if price > lows[-i] * 1.005:
                    inducement_detected = True
                    inducement_level = float(lows[-i])
                    break
        if inducement_detected:
            break

    return {
        "swing_highs": swing_highs[-5:] if len(swing_highs) > 5 else swing_highs,
        "swing_lows": swing_lows[-5:] if len(swing_lows) > 5 else swing_lows,
        "bos_detected": bool(bos_detected),
        "bos_direction": bos_direction,
        "bos_level": round(bos_level, 2),
        "bos_confirmed": bool(bos_confirmed),
        "choch_detected": bool(choch_detected),
        "choch_direction": choch_direction,
        "choch_level": round(choch_level, 2),
        "bias": bias,
        "higher_highs": bool(higher_highs),
        "higher_lows": bool(higher_lows),
        "lower_highs": bool(lower_highs),
        "lower_lows": bool(lower_lows),
        "inducement_detected": bool(inducement_detected),
        "inducement_level": round(inducement_level, 2) if inducement_level is not None else None,
    }
