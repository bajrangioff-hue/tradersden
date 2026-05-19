"""Higher timeframe PDA delivery detection."""

from typing import Any

import numpy as np
import pandas as pd


def detect_htf_pda_delivery(df: pd.DataFrame) -> dict[str, Any]:
    """Detect if price delivered through previous PDA on the higher timeframe.

    Args:
        df: Daily DataFrame with 'High', 'Low', 'Close' columns, at least 20 rows.

    Returns:
        Dict with passed, direction, and reason keys.
    """
    if len(df) < 20:
        return {"passed": False, "reason": "Not enough data"}
    highs = df["High"].values
    lows = df["Low"].values
    recent_high = float(np.max(highs[-10:]))
    recent_low = float(np.min(lows[-10:]))
    prev_high = float(np.max(highs[-20:-10]))
    prev_low = float(np.min(lows[-20:-10]))
    delivered_up = recent_high > prev_high * 1.005
    delivered_down = recent_low < prev_low * 0.995
    if delivered_up or delivered_down:
        direction = "BULLISH" if delivered_up else "BEARISH"
        return {"passed": True, "direction": direction, "reason": f"PDA delivery {direction}"}
    return {"passed": False, "reason": "No clear PDA delivery"}
