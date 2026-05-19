"""Pydantic schemas for calendar endpoint."""

from pydantic import BaseModel


class CalendarEventSchema(BaseModel):
    """A single economic calendar event."""

    title: str
    country: str
    currency: str
    impact: str
    forecast: str
    previous: str
    actual: str
    datetime: str


class CalendarResponse(BaseModel):
    """List of calendar events."""

    events: list[CalendarEventSchema]
    count: int
