"""Orchestrates all 8 ICT engines, extracts levels, computes confluence scores."""
from __future__ import annotations

import logging
from typing import Any

import numpy as np

from app.engine.fvg_engine import analyze_fvg
from app.engine.grader import grade_ict
from app.engine.killzone import analyze_killzone
from app.engine.liquidity import analyze_liquidity
from app.engine.market_structure import analyze_market_structure
from app.engine.narrative import generate_narrative
from app.engine.order_blocks import analyze_order_blocks
from app.engine.premium_discount import analyze_premium_discount
from app.services.market_data import fetch_data, fetch_pda

logger = logging.getLogger("tradepro.confluence")

_LEVEL_TYPE_MAP = {
    "ORDER_BLOCK": "ORDER_BLOCK",
    "FVG": "FVG",
    "LIQUIDITY": "LIQUIDITY",
    "BSL": "BSL",
    "SSL": "SSL",
    "DOL": "DOL",
    "OTE": "OTE",
    "INDUCEMENT": "INDUCEMENT",
    "BREAKER": "BREAKER",
    "EQUAL_HIGHS": "EQUAL_HIGHS",
    "EQUAL_LOWS": "EQUAL_LOWS",
}


async def analyze(
    symbol: str,
    interval: str = "1h",
    period: str = "1mo",
) -> dict[str, Any]:
    loop = __import__("asyncio").get_running_loop()

    df = await loop.run_in_executor(None, fetch_data, symbol, interval, period)
    pda = await loop.run_in_executor(None, fetch_pda, symbol)

    df.attrs["symbol"] = symbol

    ms = await loop.run_in_executor(None, analyze_market_structure, df)
    ob = await loop.run_in_executor(None, analyze_order_blocks, df)
    fvg = await loop.run_in_executor(None, analyze_fvg, df)
    liq = await loop.run_in_executor(None, analyze_liquidity, df, pda)
    kz = await loop.run_in_executor(None, analyze_killzone, df)
    pd_result = await loop.run_in_executor(
        None, analyze_premium_discount, df, ob, fvg
    )
    grade = await loop.run_in_executor(
        None, grade_ict, ms, ob, fvg, liq, kz, pd_result
    )
    narrative = await loop.run_in_executor(
        None, generate_narrative,
        grade["direction"], grade["checklist"],
        grade["session"], grade["amd_phase"],
        grade["daily_bias"], grade["key_levels"],
        liq, ms, pd_result,
    )

    full = {
        "symbol": symbol,
        "interval": interval,
        "pda": pda,
        "market_structure": ms,
        "order_blocks": ob,
        "fvg_analysis": fvg,
        "liquidity_analysis": liq,
        "killzone_analysis": kz,
        "premium_discount_analysis": pd_result,
        "grade": grade,
        "narrative": narrative,
    }

    levels = _extract_levels(ms, ob, fvg, liq, pd_result, kz, interval)
    levels = _compute_scores(levels, ms, kz, pd_result)

    total_score = _aggregate_score(levels)
    direction = grade.get("direction", "NEUTRAL")
    grade_letter = grade.get("grade", "F")

    return {
        "symbol": symbol,
        "interval": interval,
        "levels": levels,
        "score": total_score,
        "direction": direction,
        "grade": grade_letter,
        "narrative": narrative,
        "full_analysis": full,
    }


def _extract_levels(
    ms: dict[str, Any],
    ob: dict[str, Any],
    fvg: dict[str, Any],
    liq: dict[str, Any],
    pd_result: dict[str, Any],
    kz: dict[str, Any],
    interval: str,
) -> list[dict[str, Any]]:
    levels: list[dict[str, Any]] = []

    bullish_ob = ob.get("bullish_ob", {})
    if bullish_ob.get("valid"):
        levels.append({
            "level_type": "ORDER_BLOCK",
            "price": (bullish_ob["high"] + bullish_ob["low"]) / 2.0,
            "high": bullish_ob["high"],
            "low": bullish_ob["low"],
            "direction": "bullish",
            "confluence_score": 0.0,
            "strength": ob.get("ob_quality", "weak"),
            "source_modules": ["order_blocks"],
            "time_frame": interval,
            "is_mitigated": bullish_ob.get("mitigated", True),
            "details": {"ob_range": round(bullish_ob["high"] - bullish_ob["low"], 2)},
        })

    bearish_ob = ob.get("bearish_ob", {})
    if bearish_ob.get("valid"):
        levels.append({
            "level_type": "ORDER_BLOCK",
            "price": (bearish_ob["high"] + bearish_ob["low"]) / 2.0,
            "high": bearish_ob["high"],
            "low": bearish_ob["low"],
            "direction": "bearish",
            "confluence_score": 0.0,
            "strength": ob.get("ob_quality", "weak"),
            "source_modules": ["order_blocks"],
            "time_frame": interval,
            "is_mitigated": bearish_ob.get("mitigated", True),
            "details": {"ob_range": round(bearish_ob["high"] - bearish_ob["low"], 2)},
        })

    breaker_type = ob.get("breaker_type")
    if ob.get("breaker_detected") and breaker_type != "none":
        levels.append({
            "level_type": "BREAKER",
            "price": ob.get("breaker_level", 0.0),
            "high": None,
            "low": None,
            "direction": "bullish" if breaker_type == "bull" else "bearish",
            "confluence_score": 0.0,
            "strength": "moderate",
            "source_modules": ["order_blocks"],
            "time_frame": interval,
            "is_mitigated": False,
            "details": {},
        })

    for f in fvg.get("fvgs", []):
        levels.append({
            "level_type": "FVG",
            "price": (f["top"] + f["bottom"]) / 2.0,
            "high": f["top"],
            "low": f["bottom"],
            "direction": f.get("type", "bull") + "ish",
            "confluence_score": 0.0,
            "strength": "strong" if f.get("size_pct", 0) > 0.3 else "moderate",
            "source_modules": ["fvg_engine"],
            "time_frame": interval,
            "is_mitigated": f.get("mitigated", True),
            "details": {"gap_pct": f.get("size_pct", 0)},
        })

    for bsl in liq.get("bsl_levels", []):
        levels.append({
            "level_type": "BSL" if bsl.get("strength") != "high" else "EQUAL_HIGHS",
            "price": bsl["price"],
            "high": None,
            "low": None,
            "direction": "bearish",
            "confluence_score": 0.0,
            "strength": bsl.get("strength", "medium"),
            "source_modules": ["liquidity"],
            "time_frame": interval,
            "is_mitigated": False,
            "details": {"level_kind": bsl.get("type", "")},
        })

    for ssl in liq.get("ssl_levels", []):
        levels.append({
            "level_type": "SSL" if ssl.get("strength") != "high" else "EQUAL_LOWS",
            "price": ssl["price"],
            "high": None,
            "low": None,
            "direction": "bullish",
            "confluence_score": 0.0,
            "strength": ssl.get("strength", "medium"),
            "source_modules": ["liquidity"],
            "time_frame": interval,
            "is_mitigated": False,
            "details": {"level_kind": ssl.get("type", "")},
        })

    if liq.get("sweep_detected"):
        levels.append({
            "level_type": "LIQUIDITY",
            "price": liq.get("sweep_level", 0.0),
            "high": None,
            "low": None,
            "direction": liq.get("sweep_type", "none"),
            "confluence_score": 0.0,
            "strength": "strong",
            "source_modules": ["liquidity"],
            "time_frame": interval,
            "is_mitigated": True,
            "details": {"bars_ago": liq.get("bars_ago", 0)},
        })

    if liq.get("dol_confirmed"):
        levels.append({
            "level_type": "DOL",
            "price": liq.get("dol_level", 0.0),
            "high": None,
            "low": None,
            "direction": liq.get("dol_type", "none"),
            "confluence_score": 0.0,
            "strength": "strong",
            "source_modules": ["liquidity"],
            "time_frame": interval,
            "is_mitigated": False,
            "details": {"distance_pct": liq.get("dol_distance_pct", 0)},
        })

    if pd_result.get("price_in_ote") and pd_result.get("ote_zone_high", 0) > 0:
        levels.append({
            "level_type": "OTE",
            "price": (pd_result["ote_zone_high"] + pd_result["ote_zone_low"]) / 2.0,
            "high": pd_result["ote_zone_high"],
            "low": pd_result["ote_zone_low"],
            "direction": pd_result.get("ote_type", "none"),
            "confluence_score": 0.0,
            "strength": "moderate",
            "source_modules": ["premium_discount"],
            "time_frame": interval,
            "is_mitigated": False,
            "details": {
                "zone_pct": pd_result.get("zone_pct", 50),
                "current_zone": pd_result.get("current_zone", ""),
            },
        })

    if ms.get("inducement_detected") and ms.get("inducement_level") is not None:
        levels.append({
            "level_type": "INDUCEMENT",
            "price": ms["inducement_level"],
            "high": None,
            "low": None,
            "direction": "neutral",
            "confluence_score": 0.0,
            "strength": "moderate",
            "source_modules": ["market_structure"],
            "time_frame": interval,
            "is_mitigated": False,
            "details": {},
        })

    return levels


def _compute_scores(
    levels: list[dict[str, Any]],
    ms: dict[str, Any],
    kz: dict[str, Any],
    pd_result: dict[str, Any],
) -> list[dict[str, Any]]:
    if not levels:
        return levels

    ms_bias = ms.get("bias", "ranging")
    in_killzone = kz.get("in_killzone", False) or kz.get("in_optimal_window", False)
    price_in_ote = pd_result.get("price_in_ote", False)
    current_zone = pd_result.get("current_zone", "equilibrium")

    level_prices = [(l.get("price", 0) or 0) for l in levels]
    for i, level in enumerate(levels):
        score = 10.0

        if level.get("source_modules"):
            score += min(len(level["source_modules"]) * 5, 15)

        direction = level.get("direction", "")
        if direction != "neutral":
            if (ms_bias == "bullish" and direction == "bullish") or \
               (ms_bias == "bearish" and direction == "bearish"):
                score += 15
            elif (ms_bias == "bullish" and direction == "bearish") or \
                 (ms_bias == "bearish" and direction == "bullish"):
                score -= 5

        if not level.get("is_mitigated", True):
            score += 10

        if in_killzone:
            score += 10

        if price_in_ote:
            score += 10

        for j, other in enumerate(levels):
            if i == j:
                continue
            if _levels_overlap(level, other):
                score += 5

        if current_zone == "discount" and direction == "bullish":
            score += 10
        elif current_zone == "premium" and direction == "bearish":
            score += 10

        score = min(100.0, max(0.0, score))
        level["confluence_score"] = round(score, 1)
        if score >= 70:
            level["strength"] = "strong"
        elif score >= 40:
            level["strength"] = "moderate"
        else:
            level["strength"] = "weak"

    levels.sort(key=lambda x: x["confluence_score"], reverse=True)
    return levels


def _levels_overlap(a: dict[str, Any], b: dict[str, Any]) -> bool:
    a_price = a.get("price", 0) or 0
    b_price = b.get("price", 0) or 0
    a_high = a.get("high") or a_price
    a_low = a.get("low") or a_price
    b_high = b.get("high") or b_price
    b_low = b.get("low") or b_price
    if a_price == 0 or b_price == 0:
        return False
    if a_high >= b_low and a_low <= b_high:
        return True
    if abs(a_price - b_price) / max(a_price, 0.01) < 0.01:
        return True
    return False


def _aggregate_score(levels: list[dict[str, Any]]) -> float:
    if not levels:
        return 0.0
    top_scores = sorted(
        [l["confluence_score"] for l in levels],
        reverse=True,
    )[:3]
    return round(sum(top_scores) / len(top_scores), 1) if top_scores else 0.0
