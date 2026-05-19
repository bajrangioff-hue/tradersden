"""Pydantic schemas for news endpoint."""

from pydantic import BaseModel


class NewsItemSchema(BaseModel):
    """A single news article."""

    title: str
    publisher: str
    link: str
    summary: str
    sentiment: str
    relatedTickers: list[str]


class NewsResponse(BaseModel):
    """List of news items for a symbol."""

    symbol: str
    articles: list[NewsItemSchema]
    count: int
