from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer, field_validator


class TradeCreate(BaseModel):
    symbol: str = Field(..., max_length=20, examples=["SPY"])
    direction: str = Field(..., pattern="^(LONG|SHORT)$")
    entry_price: Decimal = Field(..., gt=0, max_digits=12, decimal_places=4)
    exit_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=4)
    quantity: Decimal = Field(..., gt=0, max_digits=12, decimal_places=4)
    entry_time: datetime
    exit_time: datetime | None = None
    stop_loss: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=4)
    take_profit: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=4)
    commission: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)
    fees: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)
    notes: str | None = None
    setup_tags: list[str] | None = None
    session: str | None = Field(None, max_length=20)
    grade_at_entry: str | None = Field(None, max_length=3)
    screenshot_paths: list[str] | None = None


class TradeUpdate(BaseModel):
    exit_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=4)
    exit_time: datetime | None = None
    stop_loss: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=4)
    take_profit: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=4)
    commission: Decimal | None = Field(None, max_digits=10, decimal_places=2)
    fees: Decimal | None = Field(None, max_digits=10, decimal_places=2)
    notes: str | None = None
    outcome: str | None = Field(None, pattern="^(WIN|LOSS|BREAK_EVEN|OPEN)$")
    setup_tags: list[str] | None = None
    screenshot_paths: list[str] | None = None


class TradeOut(BaseModel):
    id: str
    symbol: str
    direction: str
    entry_price: float
    exit_price: float | None
    quantity: float
    entry_time: datetime
    exit_time: datetime | None
    stop_loss: float | None
    take_profit: float | None
    pnl: float | None
    pnl_pct: float | None
    outcome: str | None
    commission: float
    fees: float
    notes: str | None
    setup_tags: list[str] | None
    session: str | None
    grade_at_entry: str | None
    confluence_score: float | None
    screenshot_paths: list[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_id(cls, v: object) -> str:
        return str(v) if isinstance(v, UUID) else v

    @field_serializer("entry_price", "exit_price", "stop_loss", "take_profit",
                      "pnl", "pnl_pct", "confluence_score", "commission", "fees", "quantity")
    def coerce_decimals(self, v: object) -> float | None:
        if v is None:
            return None
        return float(v)


class TradeListResponse(BaseModel):
    trades: list[TradeOut]
    total: int
    page: int
    page_size: int
    total_pages: int
