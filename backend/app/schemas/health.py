"""Pydantic schemas for health endpoint."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response model for the health check endpoint."""

    status: str
    version: str
