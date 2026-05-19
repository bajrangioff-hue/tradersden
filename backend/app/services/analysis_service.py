"""Analysis orchestration service — runs all ICT engine checks for a symbol."""

from typing import Any

import numpy as np

from app.engine.grader import grade_ict
from app.engine.market_structure import analyze_market_structure
from app.engine.order_blocks import analyze_order_blocks
from app.engine.fvg_engine import analyze_fvg
from app.engine.liquidity import analyze_liquidity
from app.engine.premium_discount import analyze_premium_discount
from app.engine.killzone import analyze_killzone
from app.engine.narrative import generate_narrative
from app.services.market_data import fetch_data, fetch_pda


def _numpy_convert(obj: Any) -> Any:
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj


def _clean(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: _clean(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_clean(v) for v in data]
    return _numpy_convert(data)


def analyze_symbol(symbol: str, es_symbol: str = "ES=F") -> dict[str, Any]:
    """Run the full ICT analysis on a symbol.

    Orchestrates all 6 ICT engines and returns a complete analysis.

    Args:
        symbol: Primary ticker to analyze.
        es_symbol: ES futures symbol (unused in ICT, kept for compat).

    Returns:
        Dict with symbol, pda, checklist, ICT grades, key_levels, direction.
    """
    df = fetch_data(symbol, interval="1h", period="1mo")
    pda = fetch_pda(symbol)

    ms = analyze_market_structure(df)
    ob = analyze_order_blocks(df)
    fvg = analyze_fvg(df)
    liq = analyze_liquidity(df, pda)
    kz = analyze_killzone(df)
    pd = analyze_premium_discount(df, ob, fvg)

    grade_result = grade_ict(ms, ob, fvg, liq, kz, pd)

    if grade_result["direction"] == "BULLISH":
        direction = "BULLISH"
        liquid_dol_type = liq.get("dol_type", "none")
        liq_state = "CLEAR" if liq.get("dol_confirmed") or liq.get("sweep_detected") else "LIMITED" if liq.get("nearest_bsl", 0) > 0 else "NONE"
    elif grade_result["direction"] == "BEARISH":
        direction = "BEARISH"
        liq_state = "CLEAR" if liq.get("dol_confirmed") or liq.get("sweep_detected") else "LIMITED" if liq.get("nearest_ssl", 0) > 0 else "NONE"
    else:
        direction = "NEUTRAL"
        liq_state = "NONE"

    ob_has_valid = bool(ob.get("bullish_ob", {}).get("valid") or ob.get("bearish_ob", {}).get("valid"))
    ms_bos_or_choch = bool(ms.get("bos_detected") or ms.get("choch_detected"))
    ote_in_zone = pd.get("price_in_ote", False)

    delivery_state: str
    if ms_bos_or_choch and ob_has_valid:
        delivery_state = "BOS/CHoCH"
    elif ms_bos_or_choch:
        delivery_state = "CHoCH"
    else:
        delivery_state = "RANGING"

    target_state = liq_state
    retrace_state: str = "IN ZONE" if ote_in_zone else "NEAR" if pd.get("ote_zone_high", 0) > 0 else "MISSED"

    narrative = generate_narrative(
        direction=direction,
        checklist=grade_result["checklist"],
        session=grade_result["session"],
        amd_phase=grade_result["amd_phase"],
        daily_bias=grade_result["daily_bias"],
        key_levels=grade_result["key_levels"],
        liquidity_analysis=liq,
        market_structure=ms,
        premium_discount=pd,
    )

    results: dict[str, Any] = {
        "symbol": symbol,
        "pda": pda,
        "checklist": grade_result["checklist"],
        "narrative": narrative,
        "direction": direction,
        "grade_letter": grade_result["grade"],
        "grade": {"A+": 10, "A": 8, "B": 6, "F": 2}.get(grade_result["grade"], 0),
        "score": grade_result["confluence_score"],
        "confluence_score": grade_result["confluence_score"],
        "confidence": grade_result["confidence"],
        "no_trade": grade_result["no_trade"],
        "no_trade_reason": grade_result["no_trade_reason"],
        "session": grade_result["session"],
        "session_quality": grade_result["session_quality"],
        "amd_phase": grade_result["amd_phase"],
        "daily_bias": grade_result["daily_bias"],
        "key_levels": grade_result["key_levels"],
        "delivery_state": delivery_state,
        "target_state": target_state,
        "retrace_state": retrace_state,
        "market_structure": ms,
        "order_blocks": ob,
        "fvg_analysis": fvg,
        "liquidity_analysis": liq,
        "killzone_analysis": kz,
        "premium_discount_analysis": pd,
    }
    return _clean(results)
