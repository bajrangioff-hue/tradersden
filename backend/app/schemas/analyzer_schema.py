"""Enhanced Pydantic schemas for the analyze endpoint."""

import re
from datetime import datetime, timezone
from typing import Any
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class SymbolPattern(str, Enum):
    """Allowed symbol formats."""
    STOCK = "STOCK"
    FUTURES = "FUTURES"
    FOREX = "FOREX"
    CRYPTO = "CRYPTO"
    INDEX = "INDEX"
    INDIA = "INDIA"

_SYMBOL_REGEX = re.compile(r"^[A-Za-z0-9=.^_\-]{2,15}$")


class AnalyzeRequest(BaseModel):
    """Request model for symbol analysis."""

    symbol: str = Field(
        ...,
        min_length=2,
        max_length=15,
        description="Financial symbol to analyze",
        examples=["SPY", "MNQ=F", "EURUSD=X", "BTC-USD", "RELIANCE.NS"],
    )

    @field_validator("symbol")
    @classmethod
    def validate_symbol_format(cls, v: str) -> str:
        if not _SYMBOL_REGEX.match(v):
            raise ValueError(
                "Symbol must be 2-15 chars, alphanumeric with .=^-_ allowed"
            )
        return v.upper()


class GradeEnum(str, Enum):
    A_PLUS = "A+"
    A = "A"
    B = "B"
    F = "F"


class DeliverySchema(BaseModel):
    """Delivery evaluation details."""
    state: str = Field(..., description="Delivery state (e.g. completed, active)")
    score: float = Field(..., ge=0, le=100, description="Delivery quality score")
    factors: dict[str, Any] = Field(default_factory=dict, description="Contributing factors")


class TargetLevel(BaseModel):
    """A single price target."""
    level: int = Field(..., description="Target number (1, 2, 3)")
    price: float = Field(..., description="Target price level")


class TargetSchema(BaseModel):
    """Calculated target information."""
    state: str = Field(..., description="Target state (clear, unclear)")
    targets: list[TargetLevel] = Field(default_factory=list, description="Price targets")
    nearest: float | None = Field(None, description="Distance to nearest target")
    runway: float | None = Field(None, description="Total runway to final target")


class RetracementSchema(BaseModel):
    """Fibonacci retracement assessment."""
    state: str = Field(..., description="Retracement state")
    depth_pct: float = Field(..., ge=0, le=100, description="Retracement depth percentage")
    fib_level: float = Field(..., ge=0, le=100, description="Fib level hit")


class ChecklistItem(BaseModel):
    """Single checklist item."""
    passed: bool
    detail: str = ""


class ChecklistSchema(BaseModel):
    """Full analysis checklist."""
    setup_grade: ChecklistItem
    liquidity_sweep: ChecklistItem
    htf_pda_delivery: ChecklistItem
    momentum: ChecklistItem
    dvg_ifvg: ChecklistItem
    clear_targets: ChecklistItem
    smt_w_es: ChecklistItem
    bias_align: ChecklistItem


class MetricsSchema(BaseModel):
    """Technical metrics snapshot."""
    rsi: float | None = Field(None, ge=0, le=100)
    atr: float | None = None
    momentum: float | None = None
    volume_ratio: float | None = None


class AnalyzeResponse(BaseModel):
    """Complete analysis response with grade and metrics."""

    status: str = "success"
    data: dict[str, Any] = Field(
        ...,
        description="Analysis payload with symbol, grade, score, delivery, targets, checklist",
    )
    meta: dict[str, Any] = Field(
        default_factory=lambda: {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "3.0",
        }
    )


class ErrorDetail(BaseModel):
    """Error detail block."""
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    details: str | None = Field(None, description="Additional error context")


class ErrorResponse(BaseModel):
    """Standard error response."""
    status: str = "error"
    error: ErrorDetail
    meta: dict[str, Any] = Field(
        default_factory=lambda: {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "3.0",
        }
    )
