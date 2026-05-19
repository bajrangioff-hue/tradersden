from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, DateTime, Index, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.compat import UUID_TYPE, ARRAY_TYPE


class ConfluenceLevel(Base):
    __tablename__ = "confluence_levels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, nullable=False, index=True
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    level_type: Mapped[str] = mapped_column(String(20), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    high: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    low: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    direction: Mapped[str | None] = mapped_column(String(10), nullable=True)
    confluence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    strength: Mapped[str | None] = mapped_column(String(10), nullable=True)
    source_modules: Mapped[Optional[list[str]]] = mapped_column(ARRAY_TYPE, nullable=True)
    time_frame: Mapped[str | None] = mapped_column(String(5), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=func.now()
    )
    is_mitigated: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_cl_user_symbol_time", "user_id", "symbol", "detected_at"),
    )
