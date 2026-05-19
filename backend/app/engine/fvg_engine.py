"""ICT Fair Value Gap engine — FVG, iFVG, mitigation, consequent encroachment, volume imbalance."""

from typing import Any

import numpy as np
import pandas as pd


def analyze_fvg(df: pd.DataFrame) -> dict[str, Any]:
    """Run full ICT FVG analysis.

    Args:
        df: DataFrame with Open, High, Low, Close columns (at least 10 rows).

    Returns:
        Dict with fvgs, ifvgs, mitigation, ce, volume_imbalance.
    """
    empty: dict[str, Any] = {
        "fvgs": [], "ifvgs": [],
        "inside_fvg": False, "fvg_type": "none",
        "ifvg_respected": False, "ifvg_level": None,
        "ce_level": None, "price_at_ce": False,
        "volume_imbalance": False, "vi_level": 0.0,
    }

    if len(df) < 10:
        return empty

    highs = df["High"].values.astype(float)
    lows = df["Low"].values.astype(float)
    closes = df["Close"].values.astype(float)
    opens = df["Open"].values.astype(float)
    price = float(closes[-1])

    lookback = min(50, len(highs))

    fvgs: list[dict[str, Any]] = []
    ifvgs: list[dict[str, Any]] = []

    for i in range(2, lookback):
        candle_range_hi = highs[i] - lows[i]
        if candle_range_hi <= 0:
            continue
        gap_pct = abs(lows[i] - highs[i - 2]) / highs[i] * 100

        bull_gap = float(lows[i]) > float(highs[i - 2])
        bear_gap = float(highs[i]) < float(lows[i - 2])

        if bull_gap and gap_pct > 0.1:
            top = float(lows[i])
            bottom = float(highs[i - 2])
            size_pct = (top - bottom) / bottom * 100 if bottom > 0 else 0
            mitigated = bool(bottom <= price <= top) or bool(closes[-1] <= bottom or closes[-1] >= top)
            fvgs.append({
                "type": "bull",
                "top": round(top, 2), "bottom": round(bottom, 2),
                "index": int(i), "mitigated": mitigated,
                "size_pct": round(size_pct, 4),
            })
            if mitigated:
                ifvgs.append({
                    "type": "bull", "top": round(top, 2), "bottom": round(bottom, 2),
                    "flipped_to": "resistance",
                })

        if bear_gap and gap_pct > 0.1:
            top = float(lows[i - 2])
            bottom = float(highs[i])
            size_pct = (top - bottom) / bottom * 100 if bottom > 0 else 0
            mitigated = bool(bottom <= price <= top) or bool(closes[-1] <= bottom or closes[-1] >= top)
            fvgs.append({
                "type": "bear",
                "top": round(top, 2), "bottom": round(bottom, 2),
                "index": int(i), "mitigated": mitigated,
                "size_pct": round(size_pct, 4),
            })
            if mitigated:
                ifvgs.append({
                    "type": "bear", "top": round(top, 2), "bottom": round(bottom, 2),
                    "flipped_to": "support",
                })

    inside_fvg = False
    fvg_type: str = "none"
    ifvg_respected = False
    ifvg_level: float | None = None

    unmitigated = [f for f in fvgs if not f["mitigated"]]
    if unmitigated:
        for f in unmitigated:
            if f["bottom"] <= price <= f["top"]:
                inside_fvg = True
                fvg_type = f["type"]
                break

    if ifvgs:
        for iv in ifvgs:
            if iv["flipped_to"] == "support" and price >= iv["top"] * 0.997:
                ifvg_respected = True
                ifvg_level = iv["top"]
            elif iv["flipped_to"] == "resistance" and price <= iv["bottom"] * 1.003:
                ifvg_respected = True
                ifvg_level = iv["bottom"]

    ce_level: float | None = None
    price_at_ce = False
    if unmitigated:
        nearest = min(unmitigated, key=lambda f: abs(price - (f["top"] + f["bottom"]) / 2), default=None)
        if nearest is not None:
            ce_level = round((nearest["top"] + nearest["bottom"]) / 2, 2)
            if ce_level and abs(price - ce_level) / max(ce_level, 0.01) < 0.002:
                price_at_ce = True

    volume_imbalance = False
    vi_level = 0.0
    for i in range(2, min(lookback, len(closes) - 1)):
        gap = abs(opens[i] - closes[i - 1])
        if gap > 0 and gap / max(closes[i - 1], 0.01) > 0.001:
            volume_imbalance = True
            vi_level = round((opens[i] + closes[i - 1]) / 2, 2)
            break

    return {
        "fvgs": fvgs[-10:] if len(fvgs) > 10 else fvgs,
        "ifvgs": ifvgs[-5:] if len(ifvgs) > 5 else ifvgs,
        "inside_fvg": bool(inside_fvg),
        "fvg_type": fvg_type,
        "ifvg_respected": bool(ifvg_respected),
        "ifvg_level": round(ifvg_level, 2) if ifvg_level is not None else None,
        "ce_level": ce_level,
        "price_at_ce": bool(price_at_ce),
        "volume_imbalance": bool(volume_imbalance),
        "vi_level": round(vi_level, 4),
    }
