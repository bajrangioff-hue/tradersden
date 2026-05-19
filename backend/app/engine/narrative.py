"""Narrative engine — generates institutional-grade market context narratives."""

from __future__ import annotations

from typing import Any


def generate_narrative(
    direction: str,
    checklist: dict[str, Any],
    session: str,
    amd_phase: str,
    daily_bias: str,
    key_levels: dict[str, Any],
    liquidity_analysis: dict[str, Any],
    market_structure: dict[str, Any],
    premium_discount: dict[str, Any],
) -> str:
    parts: list[str] = []
    ms = checklist.get("market_structure", {})
    liq = checklist.get("liquidity_sweep", {})
    fvg_check = checklist.get("fair_value_gap", {})
    ob_check = checklist.get("order_block", {})
    kz = checklist.get("killzone", {})
    pd_check = checklist.get("premium_discount", {})
    ote_check = checklist.get("ote_retracement", {})
    dol_check = checklist.get("draw_on_liquidity", {})

    session_name = (session or "").replace("_", " ").title()
    if not session_name:
        session_name = "Off-hours"

    if liq.get("passed"):
        sweep_detail = liquidity_analysis.get("sweep_type", "")
        if sweep_detail:
            parts.append(f"{session_name} swept {sweep_detail.upper()} liquidity, displacing price for delivery.")
        else:
            parts.append(f"{session_name} swept resting liquidity, creating displacement.")

    if fvg_check.get("passed"):
        parts.append("Bullish FVG formed in discount — unmitigated imbalance present.")
    elif checklist.get("fair_value_gap", {}).get("detail", "").startswith("Bear"):
        parts.append("Bearish FVG formed in premium — unmitigated imbalance present.")

    if ote_check.get("passed"):
        pd_detail = premium_discount.get("current_zone", "")
        zone_pct = premium_discount.get("zone_pct", 50)
        if pd_detail == "discount":
            parts.append(f"Price retracing into institutional OTE (62-79%) within discount array at {zone_pct:.0f}% range.")
        elif pd_detail == "premium":
            parts.append(f"Price retracing into institutional OTE (62-79%) within premium array at {zone_pct:.0f}% range.")
        else:
            parts.append("Price at equilibrium within OTE zone.")
    else:
        if premium_discount.get("current_zone") == "discount" and direction == "BULLISH":
            parts.append(f"Price at {premium_discount.get('zone_pct', 50):.0f}% discount — awaiting OTE retrace for optimal entry.")
        elif premium_discount.get("current_zone") == "premium" and direction == "BEARISH":
            parts.append(f"Price at {premium_discount.get('zone_pct', 50):.0f}% premium — awaiting OTE retrace for optimal entry.")

    if dol_check.get("passed"):
        dol_type = liquidity_analysis.get("dol_type", "")
        dol_level = liquidity_analysis.get("dol_level", "")
        if dol_type and dol_level:
            parts.append(f"Clear draw on liquidity ({dol_type.upper()}) at {dol_level} — targeting resting liquidity above/below.")

    if ms.get("passed"):
        bos_dir = market_structure.get("bos_direction", "")
        choch_dir = market_structure.get("choch_direction", "")
        if bos_dir:
            parts.append(f"Market structure confirms {bos_dir.upper()} BOS — trend continuation bias.")
        elif choch_dir:
            parts.append(f"CHoCH {choch_dir.upper()} detected — potential shift in market structure.")

    if ob_check.get("passed"):
        parts.append("Institutional order block identified as support for continuation.")

    if kz.get("passed"):
        kz_name = session_name
        amd = (amd_phase or "").upper()
        if amd:
            parts.append(f"Price within {kz_name} ({amd} phase) — optimal execution window.")
        else:
            parts.append(f"Price within {kz_name} — prime execution window active.")
    else:
        parts.append(f"Price outside prime killzone ({session_name}).")

    if daily_bias and daily_bias.lower() in ("bullish", "bearish"):
        parts.append(f"HTF bias aligns {daily_bias.upper()} — institutional order flow supports this view.")

    if not parts:
        parts.append(f"{session_name}: market in compression with no clear ICT delivery pattern. Awaiting displacement.")

    narrative = " ".join(parts)
    return narrative
