from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.compat import UUID_TYPE, JSON_TYPE, ARRAY_TYPE


class SavedSetup(Base):
    __tablename__ = "saved_setups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, nullable=False, index=True
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_snapshot: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    level_ids: Mapped[Optional[list[uuid.UUID]]] = mapped_column(ARRAY_TYPE, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
