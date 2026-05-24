from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.trade import Trade
from app.models.user import User

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats")
async def dashboard_stats(
    month: str | None = Query(None, description="YYYY-MM format, defaults to current month"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    if month:
        year_s, month_s = month.split("-")
        start = datetime(int(year_s), int(month_s), 1, tzinfo=timezone.utc)
    else:
        start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    if start.month == 12:
        end = datetime(start.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(start.year, start.month + 1, 1, tzinfo=timezone.utc)

    result = await db.execute(
        select(Trade).where(
            Trade.user_id == current_user.id,
            Trade.entry_time >= start,
            Trade.entry_time < end,
        ).order_by(Trade.entry_time.asc())
    )
    trades = result.scalars().all()

    closed = [t for t in trades if t.outcome and t.outcome != "OPEN"]
    wins = [t for t in closed if t.outcome == "WIN"]
    losses = [t for t in closed if t.outcome == "LOSS"]
    total_pnl = sum(float(t.pnl or 0) for t in closed)
    gross_profit = sum(float(t.pnl or 0) for t in wins)
    gross_loss = abs(sum(float(t.pnl or 0) for t in losses))
    win_rate = len(wins) / len(closed) * 100 if closed else 0
    profit_factor = gross_profit / gross_loss if gross_loss else 0
    max_dd = _max_drawdown(trades)
    avg_rr = _avg_risk_reward(wins, losses)

    prev_start = datetime(start.year, start.month - 1, 1, tzinfo=timezone.utc) if start.month > 1 else datetime(start.year - 1, 12, 1, tzinfo=timezone.utc)
    prev_result = await db.execute(
        select(Trade).where(
            Trade.user_id == current_user.id,
            Trade.entry_time >= prev_start,
            Trade.entry_time < start,
        )
    )
    prev_trades = prev_result.scalars().all()
    prev_closed = [t for t in prev_trades if t.outcome and t.outcome != "OPEN"]
    prev_total_pnl = sum(float(t.pnl or 0) for t in prev_closed)
    prev_win_rate = len([t for t in prev_closed if t.outcome == "WIN"]) / len(prev_closed) * 100 if prev_closed else 0

    return {
        "net_pnl": round(total_pnl, 2),
        "net_pnl_change": _pct_change(prev_total_pnl, total_pnl),
        "win_rate": round(win_rate, 1),
        "win_rate_change": round(win_rate - prev_win_rate, 1),
        "profit_factor": round(profit_factor, 2),
        "max_drawdown": round(max_dd, 1),
        "avg_rr_ratio": round(avg_rr, 2),
        "total_trades": len(closed),
        "wins": len(wins),
        "losses": len(losses),
        "month": start.strftime("%Y-%m"),
    }


@router.get("/dashboard/pnl-series")
async def dashboard_pnl_series(
    date_from: str = Query(...),
    date_to: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    start_dt = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    end_dt = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)

    result = await db.execute(
        select(Trade).where(
            Trade.user_id == current_user.id,
            Trade.exit_time >= start_dt,
            Trade.exit_time <= end_dt,
            Trade.outcome != "OPEN",
        ).order_by(Trade.exit_time.asc())
    )
    trades = result.scalars().all()

    daily: dict[str, list[float]] = {}
    for t in trades:
        day_key = t.exit_time.strftime("%Y-%m-%d") if t.exit_time else t.entry_time.strftime("%Y-%m-%d")
        if day_key not in daily:
            daily[day_key] = []
        daily[day_key].append(float(t.pnl or 0))

    cumulative = 0
    series = []
    current = start_dt
    while current <= end_dt:
        key = current.strftime("%Y-%m-%d")
        pnl_sum = sum(daily.get(key, [0]))
        if key in daily:
            cumulative += pnl_sum
        series.append({
            "date": key,
            "display": f"{current.month}/{current.day}",
            "pnl": round(pnl_sum, 2),
            "cumulative_pnl": round(cumulative, 2),
        })
        current += timedelta(days=1)

    return {"series": series}


@router.get("/dashboard/calendar")
async def dashboard_calendar(
    month: str = Query(..., description="YYYY-MM format"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    year_s, month_s = month.split("-")
    start = datetime(int(year_s), int(month_s), 1, tzinfo=timezone.utc)
    if int(month_s) == 12:
        end = datetime(int(year_s) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(int(year_s), int(month_s) + 1, 1, tzinfo=timezone.utc)

    result = await db.execute(
        select(Trade).where(
            Trade.user_id == current_user.id,
            Trade.exit_time >= start,
            Trade.exit_time < end,
            Trade.outcome != "OPEN",
        )
    )
    trades = result.scalars().all()

    daily: dict[str, dict[str, Any]] = {}
    for t in trades:
        day_key = t.exit_time.strftime("%Y-%m-%d") if t.exit_time else t.entry_time.strftime("%Y-%m-%d")
        if day_key not in daily:
            daily[day_key] = {"pnl": 0.0, "trades": 0, "wins": 0, "losses": 0}
        daily[day_key]["pnl"] += float(t.pnl or 0)
        daily[day_key]["trades"] += 1
        if t.outcome == "WIN":
            daily[day_key]["wins"] += 1
        elif t.outcome == "LOSS":
            daily[day_key]["losses"] += 1

    days = []
    current = start
    while current < end:
        key = current.strftime("%Y-%m-%d")
        if key in daily:
            d = daily[key]
            days.append({
                "date": key,
                "day": current.day,
                "pnl": round(d["pnl"], 2),
                "trades": d["trades"],
                "positive": d["pnl"] >= 0,
            })
        else:
            days.append({
                "date": key,
                "day": current.day,
                "pnl": 0,
                "trades": 0,
                "positive": None,
            })
        current += timedelta(days=1)

    return {"month": month, "days": days}


def _max_drawdown(trades: list[Trade]) -> float:
    sorted_trades = sorted(trades, key=lambda t: t.entry_time)
    equity = 0
    peak = 0
    dd = 0
    for t in sorted_trades:
        pnl = float(t.pnl or 0)
        equity += pnl
        if equity > peak:
            peak = equity
        drawdown = (peak - equity) / peak * 100 if peak > 0 else 0
        if drawdown > dd:
            dd = drawdown
    return dd


def _avg_risk_reward(wins: list[Trade], losses: list[Trade]) -> float:
    if not wins:
        return 0
    avg_win = sum(float(t.pnl or 0) for t in wins) / len(wins)
    if not losses:
        return avg_win
    avg_loss = abs(sum(float(t.pnl or 0) for t in losses) / len(losses))
    return avg_win / avg_loss if avg_loss else 0


def _pct_change(prev: float, curr: float) -> float:
    if prev == 0:
        return 100 if curr > 0 else 0
    return round((curr - prev) / abs(prev) * 100, 1)
