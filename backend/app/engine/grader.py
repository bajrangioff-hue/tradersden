"""ICT Grader — pure ICT 8-item checklist with A+/A/B/F grade matrix."""

from __future__ import annotations

from typing import Any


def grade_ict(
    market_structure: dict[str, Any],
    order_block: dict[str, Any],
    fvg: dict[str, Any],
    liquidity: dict[str, Any],
    killzone: dict[str, Any],
    premium_discount: dict[str, Any],
) -> dict[str, Any]:
    """Run the pure ICT grading matrix.

    Args:
        market_structure: Output from market_structure.analyze_market_structure().
        order_block: Output from order_blocks.analyze_order_blocks().
        fvg: Output from fvg_engine.analyze_fvg().
        liquidity: Output from liquidity.analyze_liquidity().
        killzone: Output from killzone.analyze_killzone().
        premium_discount: Output from premium_discount.analyze_premium_discount().

    Returns:
        Dict with grade, confluence_score, confidence, session, amd_phase,
        daily_bias, no_trade, no_trade_reason, checklist, key_levels.
    """
    direction = (
        "BULLISH"
        if market_structure.get("bias") == "bullish"
        or market_structure.get("bos_direction") == "bull"
        or market_structure.get("choch_direction") == "bull"
        else "BEARISH"
        if market_structure.get("bias") == "bearish"
        or market_structure.get("bos_direction") == "bear"
        or market_structure.get("choch_direction") == "bear"
        else "NEUTRAL"
    )

    # ── ICT Checklist ──

    ms_detail = ""
    ms_passed = False
    bos_dir = market_structure.get("bos_direction", "none")
    choch_dir = market_structure.get("choch_direction", "none")
    if bos_dir != "none" or choch_dir != "none":
        ms_passed = True
        if bos_dir != "none":
            ms_detail = f"BOS {bos_dir.upper()} at {market_structure['bos_level']}"
        elif choch_dir != "none":
            ms_detail = f"CHoCH {choch_dir.upper()} at {market_structure['choch_level']}"
    else:
        ms_detail = "No structure break — ranging"

    ob_detail = ""
    ob_passed = False
    if order_block.get("bullish_ob", {}).get("valid") and not order_block.get("bullish_ob", {}).get("mitigated", True):
        ob_passed = True
        ob_detail = f"Bull OB {order_block['bullish_ob']['low']}-{order_block['bullish_ob']['high']}"
    elif order_block.get("bearish_ob", {}).get("valid") and not order_block.get("bearish_ob", {}).get("mitigated", True):
        ob_passed = True
        ob_detail = f"Bear OB {order_block['bearish_ob']['low']}-{order_block['bearish_ob']['high']}"
    else:
        ob_detail = "No valid unmitigated OB"

    fvg_detail = ""
    fvg_passed = False
    unmitigated_fvgs = [f for f in fvg.get("fvgs", []) if not f.get("mitigated", True)]
    if unmitigated_fvgs:
        fvg_passed = True
        nearest = unmitigated_fvgs[0]
        fvg_detail = f"{nearest['type'].upper()} FVG {nearest['bottom']}-{nearest['top']}"
    else:
        fvg_detail = "No unmitigated FVG"

    liq_detail = ""
    liq_passed = False
    if liquidity.get("sweep_detected"):
        liq_passed = True
        liq_detail = f"{liquidity['sweep_type'].upper()} sweep {liquidity['bars_ago']} bars ago"
    else:
        liq_detail = "No recent sweep detected"

    kz_detail = ""
    kz_passed = False
    session_quality = killzone.get("session_quality", "NEUTRAL")
    current_session = killzone.get("current_session", "")
    in_kz = killzone.get("in_killzone", False)
    in_opt = killzone.get("in_optimal_window", False)
    if in_kz or in_opt:
        kz_passed = True
        kz_detail = f"{killzone.get('killzone_name', current_session)} active"
    else:
        kz_detail = f"{current_session} — off hours"

    pd_detail = ""
    pd_passed = False
    current_zone = premium_discount.get("current_zone", "equilibrium")
    if direction == "BULLISH" and current_zone == "discount":
        pd_passed = True
        pd_detail = f"In discount ({premium_discount['zone_pct']:.0f}%)"
    elif direction == "BEARISH" and current_zone == "premium":
        pd_passed = True
        pd_detail = f"In premium ({premium_discount['zone_pct']:.0f}%)"
    elif current_zone == "equilibrium":
        pd_detail = "At equilibrium"
    else:
        pd_detail = f"{'Buying in premium' if direction == 'BULLISH' else 'Selling in discount'}"

    ote_detail = ""
    ote_passed = False
    if premium_discount.get("price_in_ote"):
        ote_passed = True
        ote_detail = f"In OTE zone ({premium_discount['ote_type'].upper()})"
    else:
        ote_detail = "Not at OTE — chasing price"

    dol_detail = ""
    dol_passed = False
    if liquidity.get("dol_confirmed"):
        dol_passed = True
        dol_detail = f"{liquidity['dol_type'].upper()} at {liquidity['dol_level']}"
    else:
        dol_detail = "No clear liquidity draw"

    # ── No Trade Conditions ──
    no_trade = False
    no_trade_reason: str | None = None

    if current_session in ("NY_Lunch", "NY_Lunch2"):
        no_trade = True
        no_trade_reason = "NY Lunch session — avoid"
    elif not liquidity.get("dol_confirmed") and not liquidity.get("sweep_detected"):
        no_trade = True
        no_trade_reason = "No liquidity draw identified"
    elif direction == "BULLISH" and current_zone == "premium":
        no_trade = True
        no_trade_reason = "Buying in premium zone"
    elif direction == "BEARISH" and current_zone == "discount":
        no_trade = True
        no_trade_reason = "Selling in discount zone"
    elif not ms_passed:
        no_trade = True
        no_trade_reason = "No market structure confirmation"

    # ── Checklist ──
    checklist = {
        "market_structure": {"passed": ms_passed, "detail": ms_detail},
        "order_block": {"passed": ob_passed, "detail": ob_detail},
        "fair_value_gap": {"passed": fvg_passed, "detail": fvg_detail},
        "liquidity_sweep": {"passed": liq_passed, "detail": liq_detail},
        "killzone": {"passed": kz_passed, "detail": kz_detail},
        "premium_discount": {"passed": pd_passed, "detail": pd_detail},
        "ote_retracement": {"passed": ote_passed, "detail": ote_detail},
        "draw_on_liquidity": {"passed": dol_passed, "detail": dol_detail},
    }

    passed_count = sum(1 for v in checklist.values() if v["passed"])

    # ── Confluence scoring ──
    base_score = passed_count * 12.5
    array_bonus = 0
    if ob_passed and fvg_passed and ote_passed:
        array_bonus = 10
    kz_bonus = 10 if kz_passed else 0
    confluence_score = min(100, base_score + array_bonus + kz_bonus)

    # ── Grade Matrix ──
    array_confluence = ob_passed and fvg_passed
    grade_letter: str
    if passed_count >= 7 and kz_passed and array_confluence:
        grade_letter = "A+"
    elif passed_count >= 6 and kz_passed:
        grade_letter = "A"
    elif passed_count >= 4:
        grade_letter = "B"
    else:
        grade_letter = "F"

    if no_trade:
        grade_letter = "F"

    # ── Key Levels ──
    ob_info = None
    if order_block.get("bullish_ob", {}).get("valid"):
        ob_info = {"high": order_block["bullish_ob"]["high"], "low": order_block["bullish_ob"]["low"]}
    elif order_block.get("bearish_ob", {}).get("valid"):
        ob_info = {"high": order_block["bearish_ob"]["high"], "low": order_block["bearish_ob"]["low"]}

    fvg_info = None
    if unmitigated_fvgs:
        fvg_info = {"top": unmitigated_fvgs[0]["top"], "bottom": unmitigated_fvgs[0]["bottom"]}

    ote_zone = None
    if premium_discount.get("ote_zone_high", 0) > 0:
        ote_zone = {"high": premium_discount["ote_zone_high"], "low": premium_discount["ote_zone_low"]}

    confidence: str
    if no_trade:
        confidence = "AVOID"
    elif confluence_score >= 80:
        confidence = "HIGH"
    elif confluence_score >= 50:
        confidence = "MODERATE"
    else:
        confidence = "LOW"

    return {
        "grade": grade_letter,
        "confluence_score": round(confluence_score, 1),
        "confidence": confidence,
        "direction": direction,
        "session": current_session,
        "session_quality": session_quality,
        "amd_phase": killzone.get("amd_phase", "unknown"),
        "daily_bias": killzone.get("daily_bias", "neutral"),
        "no_trade": no_trade,
        "no_trade_reason": no_trade_reason,
        "checklist": checklist,
        "key_levels": {
            "order_block": ob_info,
            "fvg": fvg_info,
            "ote_zone": ote_zone,
            "dol_target": liquidity.get("dol_level"),
            "equilibrium": premium_discount.get("equilibrium"),
        },
        "passed_count": passed_count,
    }
