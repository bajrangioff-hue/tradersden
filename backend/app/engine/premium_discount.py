"""ICT Premium/Discount engine — range, OTE, SD levels, array alignment."""

import math
from typing import Any

import numpy as np
import pandas as pd


def analyze_premium_discount(
    df: pd.DataFrame,
    order_block: dict[str, Any] | None = None,
    fvg: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run full ICT Premium / Discount analysis.

    Args:
        df: DataFrame with High, Low, Close columns (at least 20 rows).
        order_block: Dict from order_blocks.analyze_order_blocks().
        fvg: Dict from fvg_engine.analyze_fvg().

    Returns:
        Dict with range, zones, ote, sd_levels, array_alignment.
    """
    empty: dict[str, Any] = {
        "range_high": 0.0, "range_low": 0.0, "equilibrium": 0.0, "range_size": 0.0,
        "current_zone": "equilibrium", "zone_pct": 50.0,
        "ote_zone_high": 0.0, "ote_zone_low": 0.0, "price_in_ote": False, "ote_type": "none",
        "sd_levels": {"minus2": 0.0, "minus1": 0.0, "eq": 0.0, "plus1": 0.0, "plus2": 0.0},
        "array_confluence": False, "confluence_zone": None, "confluence_strength": 0,
    }

    if len(df) < 20:
        return empty

    highs = df["High"].values.astype(float)
    lows = df["Low"].values.astype(float)
    closes = df["Close"].values.astype(float)
    price = float(closes[-1])

    range_high = float(np.max(highs[-20:]))
    range_low = float(np.min(lows[-20:]))
    range_size = range_high - range_low
    equilibrium = (range_high + range_low) / 2.0

    if range_size <= 0:
        return empty

    if price > equilibrium:
        current_zone = "premium"
        zone_pct = (price - equilibrium) / (range_high - equilibrium) * 100 if range_high > equilibrium else 0
    else:
        current_zone = "discount"
        zone_pct = (equilibrium - price) / (equilibrium - range_low) * 100 if equilibrium > range_low else 0

    zone_pct = min(100.0, max(0.0, float(zone_pct)))

    swing_high = float(np.max(highs[-10:]))
    swing_low = float(np.min(lows[-10:]))
    swing_range = swing_high - swing_low

    if swing_range <= 0:
        ote_high = equilibrium
        ote_low = equilibrium
    else:
        ote_high = swing_high - swing_range * 0.62
        ote_low = swing_high - swing_range * 0.79

    price_in_ote = bool(ote_low <= price <= ote_high)
    ote_type: str = "none"
    if price_in_ote:
        if price < equilibrium:
            ote_type = "bullish"
        else:
            ote_type = "bearish"

    sd_mult = range_size * 0.5
    sd_levels = {
        "minus2": round(equilibrium - 2 * sd_mult, 2),
        "minus1": round(equilibrium - sd_mult, 2),
        "eq": round(equilibrium, 2),
        "plus1": round(equilibrium + sd_mult, 2),
        "plus2": round(equilibrium + 2 * sd_mult, 2),
    }

    confluence_strength = 0
    confluence_high = -math.inf
    confluence_low = math.inf

    if order_block:
        for ob_key in ("bullish_ob", "bearish_ob"):
            ob = order_block.get(ob_key, {})
            if ob.get("valid") and not ob.get("mitigated", True):
                ob_mid = (ob["high"] + ob["low"]) / 2
                if abs(ob_mid - equilibrium) / max(equilibrium, 0.01) < 0.02:
                    confluence_strength += 1
                    confluence_high = max(confluence_high, ob["high"])
                    confluence_low = min(confluence_low, ob["low"])

    if fvg:
        for f in fvg.get("fvgs", []):
            if not f.get("mitigated", True):
                fvg_mid = (f["top"] + f["bottom"]) / 2
                if abs(fvg_mid - equilibrium) / max(equilibrium, 0.01) < 0.02:
                    confluence_strength += 1
                    confluence_high = max(confluence_high, f["top"])
                    confluence_low = min(confluence_low, f["bottom"])

    if price_in_ote:
        ote_mid = (ote_high + ote_low) / 2
        if abs(ote_mid - equilibrium) / max(equilibrium, 0.01) < 0.02:
            confluence_strength += 1
            confluence_high = max(confluence_high, ote_high)
            confluence_low = min(confluence_low, ote_low)

    array_confluence = confluence_strength >= 2

    return {
        "range_high": round(range_high, 2),
        "range_low": round(range_low, 2),
        "equilibrium": round(equilibrium, 2),
        "range_size": round(range_size, 2),
        "current_zone": current_zone,
        "zone_pct": round(zone_pct, 1),
        "ote_zone_high": round(ote_high, 2),
        "ote_zone_low": round(ote_low, 2),
        "price_in_ote": bool(price_in_ote),
        "ote_type": ote_type,
        "sd_levels": sd_levels,
        "array_confluence": bool(array_confluence),
        "confluence_zone": {"high": round(confluence_high, 2), "low": round(confluence_low, 2)} if array_confluence else None,
        "confluence_strength": int(confluence_strength),
    }
