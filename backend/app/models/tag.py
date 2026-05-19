from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.compat import UUID_TYPE


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_tag_user_name"),
    )


class TradeTagLink(Base):
    __tablename__ = "trade_tags"

    trade_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, ForeignKey("trades.id"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, ForeignKey("tags.id"), primary_key=True
    )
