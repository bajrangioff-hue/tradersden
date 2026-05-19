from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    name: str = Field(..., max_length=50, examples=["ICT 2022"])
    color: str = Field(default="#6366f1", max_length=7, pattern="^#[0-9a-fA-F]{6}$")


class TagUpdate(BaseModel):
    name: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=7, pattern="^#[0-9a-fA-F]{6}$")


class TagOut(BaseModel):
    id: str
    name: str
    color: str

    model_config = {"from_attributes": True}
