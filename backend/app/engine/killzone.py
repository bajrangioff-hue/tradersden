"""ICT Killzone / Session engine — session detection, AMD, optimal entry windows, daily bias."""

from datetime import datetime, timezone, timedelta
from typing import Any

import numpy as np
import pandas as pd


_SESSIONS = [
    ("Asia", 0, 7, "NEUTRAL"),
    ("London_Open_KZ", 7, 9, "PRIME"),
    ("London", 9, 12, "GOOD"),
    ("NY_Lunch", 12, 13, "AVOID"),
    ("NY_Open_KZ", 13, 15, "PRIME"),
    ("NY_AM", 15, 17, "GOOD"),
    ("NY_Lunch2", 17, 19, "AVOID"),
    ("NY_PM", 19, 21, "NEUTRAL"),
    ("Off", 21, 24, "AVOID"),
]

_AMD_SESSIONS = {
    "accumulation": ("Asia",),
    "manipulation": ("London_Open_KZ",),
    "distribution": ("NY_Open_KZ", "NY_AM"),
}


def _get_session(hour: int) -> tuple[str, str]:
    for name, start, end, quality in _SESSIONS:
        if start <= hour < end:
            return name, quality
    return "Off", "AVOID"


def analyze_killzone(df: pd.DataFrame | None = None) -> dict[str, Any]:
    """Run full ICT Killzone / Session analysis.

    Args:
        df: Optional DataFrame with High, Low columns for session high/low tracking.

    Returns:
        Dict with session info, AMD phase, entry windows, session levels, daily bias.
    """
    now = datetime.now(timezone.utc)
    hour = now.hour
    minute = now.minute

    current_session, session_quality = _get_session(hour)
    in_killzone = current_session in ("London_Open_KZ", "NY_Open_KZ")
    killzone_name = current_session if in_killzone else ""

    if current_session == "Asia":
        amd_phase = "accumulation"
    elif current_session == "London_Open_KZ":
        amd_phase = "manipulation"
    elif current_session in ("NY_Open_KZ", "NY_AM"):
        amd_phase = "distribution"
    else:
        amd_phase = "unknown"

    in_optimal_window = False
    window_name: str | None = None

    if 7 <= hour < 8:
        in_optimal_window = True
        window_name = "London Open"
    elif 13 <= hour < 14:
        in_optimal_window = True
        window_name = "NY Open"
    elif (10 <= hour < 11) or (14 <= hour < 15):
        in_optimal_window = True
        window_name = "Silver Bullet"

    minutes_to_next_window: int = 0
    windows = [(7, 0, "London Open"), (10, 0, "Silver Bullet"), (13, 0, "NY Open"), (14, 0, "Silver Bullet")]
    current_total = hour * 60 + minute
    for wh, wm, wname in windows:
        wtotal = wh * 60 + wm
        if wtotal > current_total:
            minutes_to_next_window = wtotal - current_total
            break
    if minutes_to_next_window == 0:
        tomorrow = (7 * 60) + 24 * 60 - current_total
        minutes_to_next_window = tomorrow

    session_high = 0.0
    session_low = 999999.0
    if df is not None and len(df) >= 5:
        highs = df["High"].values.astype(float)
        lows = df["Low"].values.astype(float)
        recent = min(5, len(highs))
        session_high = float(np.max(highs[-recent:]))
        session_low = float(np.min(lows[-recent:]))
    session_range = session_high - session_low if session_high > session_low else 0.0

    daily_bias: str = "neutral"
    opened_above_pdm = False
    pdm = 0.0
    if df is not None and len(df) >= 5:
        prev_day_high = float(np.max(df["High"].values[-5:-1]))
        prev_day_low = float(np.min(df["Low"].values[-5:-1]))
        pdm = (prev_day_high + prev_day_low) / 2.0
        open_price = float(df["Open"].values[-1]) if "Open" in df.columns else 0.0
        if open_price > pdm:
            opened_above_pdm = True
            daily_bias = "bullish"
        elif open_price < pdm:
            daily_bias = "bearish"
        else:
            daily_bias = "neutral"

    return {
        "current_session": current_session,
        "in_killzone": bool(in_killzone),
        "killzone_name": killzone_name,
        "session_quality": session_quality,
        "amd_phase": amd_phase,
        "in_optimal_window": bool(in_optimal_window),
        "window_name": window_name,
        "minutes_to_next_window": int(minutes_to_next_window),
        "session_high": round(session_high, 2),
        "session_low": round(session_low, 2),
        "session_range": round(session_range, 2),
        "daily_bias": daily_bias,
        "opened_above_pdm": bool(opened_above_pdm),
        "pdm": round(pdm, 2),
    }
