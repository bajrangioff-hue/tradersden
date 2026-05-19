from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ConfluenceLevelOut(BaseModel):
    id: str | None = None
    level_type: str = Field(examples=["ORDER_BLOCK"])
    price: float
    high: float | None = None
    low: float | None = None
    direction: str | None = None
    confluence_score: float = 0.0
    strength: str = "weak"
    source_modules: list[str] = Field(default_factory=list)
    time_frame: str = "1h"
    is_mitigated: bool = False
    notes: str | None = None
    is_favorite: bool = False
    details: dict[str, Any] = Field(default_factory=dict)
    detected_at: datetime | None = None

    model_config = {"from_attributes": True}


class AnalyzeResponse(BaseModel):
    symbol: str
    interval: str
    levels: list[ConfluenceLevelOut]
    score: float = 0.0
    direction: str = "NEUTRAL"
    grade: str = "F"
    narrative: str = ""
    full_analysis: dict[str, Any] = Field(default_factory=dict)


class LevelCreate(BaseModel):
    level_type: str
    price: float
    high: float | None = None
    low: float | None = None
    direction: str | None = None
    confluence_score: float = 0.0
    strength: str = "weak"
    source_modules: list[str] = Field(default_factory=list)
    time_frame: str = "1h"
    notes: str | None = None
    is_favorite: bool = False


class LevelUpdate(BaseModel):
    notes: str | None = None
    is_favorite: bool | None = None
    is_mitigated: bool | None = None
