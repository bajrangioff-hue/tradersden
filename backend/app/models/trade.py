from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Index, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.compat import UUID_TYPE, ARRAY_TYPE


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, nullable=False, index=True
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    direction: Mapped[str] = mapped_column(String(6), nullable=False)
    entry_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    exit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    exit_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stop_loss: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    take_profit: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    pnl: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    pnl_pct: Mapped[Decimal | None] = mapped_column(Numeric(8, 4), nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(11), nullable=True)
    commission: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    fees: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    setup_tags: Mapped[Optional[list[str]]] = mapped_column(ARRAY_TYPE, nullable=True)
    session: Mapped[str | None] = mapped_column(String(20), nullable=True)
    grade_at_entry: Mapped[str | None] = mapped_column(String(3), nullable=True)
    confluence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    screenshot_paths: Mapped[Optional[list[str]]] = mapped_column(ARRAY_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_trades_user_symbol", "user_id", "symbol"),
        Index("idx_trades_entry_time", "user_id", "entry_time"),
        Index("idx_trades_outcome", "user_id", "outcome"),
    )
