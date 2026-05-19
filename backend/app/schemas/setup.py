from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class SetupCreate(BaseModel):
    symbol: str = Field(..., max_length=20)
    title: str | None = Field(None, max_length=200)
    notes: str | None = None
    analysis_snapshot: dict[str, Any]
    level_ids: list[str] = Field(default_factory=list)


class SetupOut(BaseModel):
    id: str
    symbol: str
    title: str | None
    notes: str | None
    analysis_snapshot: dict[str, Any]
    level_ids: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
