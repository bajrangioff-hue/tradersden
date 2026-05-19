"""Enhanced Pydantic schemas for the news endpoint."""

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, HttpUrl


class NewsArticle(BaseModel):
    """A single news article."""

    headline: str = Field(..., max_length=500, description="Article headline")
    source: str = Field("", description="News source (e.g. Reuters, Bloomberg)", examples=["Reuters", "Bloomberg"])
    published_at: Optional[str] = Field(None, description="ISO 8601 publication timestamp")
    url: Optional[str] = Field(None, description="Article URL")
    summary: Optional[str] = Field(None, max_length=1000, description="Article summary")
    sentiment: Optional[str] = Field(None, description="Classified sentiment")

    @field_validator("sentiment")
    @classmethod
    def validate_sentiment(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("positive", "neutral", "negative"):
            raise ValueError("sentiment must be 'positive', 'neutral', or 'negative'")
        return v


class NewsResponse(BaseModel):
    """News response for a symbol."""

    status: str = "success"
    data: dict[str, Any] = Field(
        ...,
        description="News payload with symbol, articles, and count",
    )
    meta: dict[str, Any] = Field(
        default_factory=lambda: {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "2.0",
        }
    )
