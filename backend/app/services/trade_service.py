from __future__ import annotations

import math
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trade import Trade


async def create_trade(
    db: AsyncSession,
    user_id: UUID,
    data: dict[str, Any],
) -> Trade:
    pnl = None
    pnl_pct = None
    outcome = None

    if data.get("exit_price") is not None:
        entry = Decimal(str(data["entry_price"]))
        exit_ = Decimal(str(data["exit_price"]))
        qty = Decimal(str(data["quantity"]))
        comm = Decimal(str(data.get("commission", 0)))
        fees = Decimal(str(data.get("fees", 0)))
        direction = data["direction"]

        if direction == "LONG":
            pnl = float((exit_ - entry) * qty - comm - fees)
            pnl_pct_raw = (exit_ - entry) / entry
        else:
            pnl = float((entry - exit_) * qty - comm - fees)
            pnl_pct_raw = (entry - exit_) / entry

        pnl_pct = round(float(pnl_pct_raw), 4)
        pnl = round(pnl, 2)
        outcome = "WIN" if pnl > 0 else "LOSS" if pnl < 0 else "BREAK_EVEN"

    source_modules_val = data.get("source_modules")
    trade = Trade(
        user_id=user_id,
        symbol=data["symbol"],
        direction=data["direction"],
        entry_price=data["entry_price"],
        exit_price=data.get("exit_price"),
        quantity=data["quantity"],
        entry_time=data["entry_time"],
        exit_time=data.get("exit_time"),
        stop_loss=data.get("stop_loss"),
        take_profit=data.get("take_profit"),
        commission=data.get("commission", 0),
        fees=data.get("fees", 0),
        notes=data.get("notes"),
        setup_tags=data.get("setup_tags"),
        session=data.get("session"),
        grade_at_entry=data.get("grade_at_entry"),
        screenshot_paths=data.get("screenshot_paths"),
        pnl=pnl,
        pnl_pct=pnl_pct,
        outcome=outcome,
    )
    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade


async def get_trade(
    db: AsyncSession,
    user_id: UUID,
    trade_id: UUID,
) -> Trade | None:
    result = await db.execute(
        select(Trade).where(Trade.id == trade_id, Trade.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_trades(
    db: AsyncSession,
    user_id: UUID,
    symbol: str | None = None,
    outcome: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tags: list[str] | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    query = select(Trade).where(Trade.user_id == user_id)

    if symbol:
        query = query.where(Trade.symbol == symbol.upper())
    if outcome:
        query = query.where(Trade.outcome == outcome.upper())
    if date_from:
        query = query.where(Trade.entry_time >= date_from)
    if date_to:
        query = query.where(Trade.entry_time <= date_to)
    if tags:
        tag_filter = [Trade.setup_tags.any(t) for t in tags]
        from functools import reduce
        import operator
        query = query.where(reduce(operator.and_, tag_filter))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Trade.entry_time.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    trades = list(result.scalars().all())

    total_pages = max(1, math.ceil(total / page_size))

    return {
        "trades": trades,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def update_trade(
    db: AsyncSession,
    trade: Trade,
    data: dict[str, Any],
) -> Trade:
    for field in (
        "exit_price", "exit_time", "stop_loss", "take_profit",
        "commission", "fees", "notes", "outcome",
        "setup_tags", "screenshot_paths",
    ):
        if field in data:
            setattr(trade, field, data[field])

    if "exit_price" in data and data["exit_price"] is not None:
        entry = trade.entry_price
        exit_ = Decimal(str(data["exit_price"]))
        qty = trade.quantity
        comm = trade.commission or Decimal("0")
        fees = trade.fees or Decimal("0")

        if trade.direction == "LONG":
            pnl_val = float((exit_ - entry) * qty - comm - fees)
            pnl_pct_raw = float((exit_ - entry) / entry)
        else:
            pnl_val = float((entry - exit_) * qty - comm - fees)
            pnl_pct_raw = float((entry - exit_) / entry)

        trade.pnl = round(pnl_val, 2)
        trade.pnl_pct = round(pnl_pct_raw, 4)
        trade.outcome = "WIN" if pnl_val > 0 else "LOSS" if pnl_val < 0 else "BREAK_EVEN"

    if "outcome" in data and data["outcome"] == "OPEN":
        trade.exit_price = None
        trade.exit_time = None
        trade.pnl = None
        trade.pnl_pct = None

    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade


async def delete_trade(
    db: AsyncSession,
    trade: Trade,
) -> None:
    await db.delete(trade)
    await db.flush()
