"""Enhanced Pydantic schemas for the calendar endpoint."""

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

_IMPACTS = {"high", "medium", "low"}


class CalendarEvent(BaseModel):
    """A single economic calendar event with lenient parsing of raw data."""

    title: str = Field(..., description="Event name")
    country: str = Field(..., description="Country/region code", examples=["USD", "EUR", "GBP"])
    currency: str = Field("", description="Currency code", examples=["USD", "EUR", "GBP"])
    impact: str = Field("low", description="Event impact level")
    forecast: Optional[float] = Field(None, description="Forecasted value")
    previous: Optional[float] = Field(None, description="Previous value")
    actual: Optional[float] = Field(None, description="Actual value")
    datetime: str = Field("", description="Event date/time string")
    source: str = Field("faireconomy", description="Data source name")

    @field_validator("impact", mode="before")
    @classmethod
    def normalize_impact(cls, v: Any) -> str:
        s = str(v).lower() if v is not None else "low"
        if s in ("high", "red", "3"):
            return "high"
        if s in ("medium", "orange", "2"):
            return "medium"
        if s in ("low", "yellow", "1"):
            return "low"
        return "low"

    @field_validator("forecast", "previous", "actual", mode="before")
    @classmethod
    def parse_numeric(cls, v: Any) -> Optional[float]:
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            return None

    @field_validator("currency", "country", mode="before")
    @classmethod
    def normalize_string(cls, v: Any) -> str:
        s = str(v).strip().upper() if v is not None else ""
        return s[:4]


class CalendarEventList(BaseModel):
    """List of calendar events with metadata."""

    events: list[CalendarEvent] = Field(default_factory=list, description="Calendar events")
    count: int = Field(0, description="Number of events")
    meta: dict[str, Any] = Field(
        default_factory=lambda: {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "filters_applied": False,
        }
    )


class CalendarRequest(BaseModel):
    """Filtering options for calendar events."""

    impact_filter: Optional[list[str]] = Field(
        None,
        description="Filter by impact levels",
        examples=[["high", "medium"]],
    )
    currency_filter: Optional[list[str]] = Field(
        None,
        description="Filter by currency codes",
        examples=[["USD", "EUR", "GBP"]],
    )
    sort_by: str = Field("datetime", description="Sort field")
    sort_order: str = Field("asc", description="Sort direction")

    @field_validator("impact_filter")
    @classmethod
    def validate_impact_filter(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is not None:
            for item in v:
                if item.lower() not in _IMPACTS:
                    raise ValueError(f"Invalid impact '{item}', must be one of {_IMPACTS}")
        return [i.lower() for i in v] if v else v

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        if v not in ("datetime", "impact"):
            raise ValueError("sort_by must be 'datetime' or 'impact'")
        return v

    @field_validator("sort_order")
    @classmethod
    def validate_sort_order(cls, v: str) -> str:
        if v not in ("asc", "desc"):
            raise ValueError("sort_order must be 'asc' or 'desc'")
        return v
