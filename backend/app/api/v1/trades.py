from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.trade import TradeCreate, TradeListResponse, TradeOut, TradeUpdate
from app.services import trade_service

router = APIRouter(tags=["trades"])


@router.post(
    "/trades",
    response_model=TradeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create trade",
    description="Log a new trade entry. PnL and outcome are computed automatically when exit_price is provided.",
)
async def create_trade(
    body: TradeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeOut:
    trade = await trade_service.create_trade(db, current_user.id, body.model_dump())
    return TradeOut.model_validate(trade)


@router.get(
    "/trades",
    response_model=TradeListResponse,
    summary="List trades",
    description="Paginated list of trades with optional filters by symbol, outcome, date range, and tags.",
)
async def list_trades(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = Query(None, max_length=20),
    outcome: Optional[str] = Query(None, pattern="^(WIN|LOSS|BREAK_EVEN|OPEN)$"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    tags: Optional[str] = Query(None, description="Comma-separated tag names"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeListResponse:
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    result = await trade_service.list_trades(
        db,
        user_id=current_user.id,
        symbol=symbol,
        outcome=outcome,
        date_from=date_from,
        date_to=date_to,
        tags=tag_list,
        page=page,
        page_size=page_size,
    )
    return TradeListResponse(
        trades=[TradeOut.model_validate(t) for t in result["trades"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get(
    "/trades/{trade_id}",
    response_model=TradeOut,
    summary="Get trade",
    description="Return a single trade by ID.",
)
async def get_trade(
    trade_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeOut:
    trade = await trade_service.get_trade(db, current_user.id, trade_id)
    if trade is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    return TradeOut.model_validate(trade)


@router.patch(
    "/trades/{trade_id}",
    response_model=TradeOut,
    summary="Update trade",
    description="Update trade fields. PnL is re-computed if exit_price changes.",
)
async def update_trade(
    trade_id: UUID,
    body: TradeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeOut:
    trade = await trade_service.get_trade(db, current_user.id, trade_id)
    if trade is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    updated = await trade_service.update_trade(db, trade, body.model_dump(exclude_none=True))
    return TradeOut.model_validate(updated)


@router.delete(
    "/trades/{trade_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete trade",
    description="Permanently delete a trade entry.",
)
async def delete_trade(
    trade_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    trade = await trade_service.get_trade(db, current_user.id, trade_id)
    if trade is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    await trade_service.delete_trade(db, trade)
