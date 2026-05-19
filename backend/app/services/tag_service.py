from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag


async def list_tags(db: AsyncSession, user_id: UUID) -> list[Tag]:
    result = await db.execute(
        select(Tag).where(Tag.user_id == user_id).order_by(Tag.name)
    )
    return list(result.scalars().all())


async def create_tag(
    db: AsyncSession,
    user_id: UUID,
    name: str,
    color: str = "#6366f1",
) -> Tag:
    existing = await db.execute(
        select(Tag).where(Tag.user_id == user_id, Tag.name == name)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Tag '{name}' already exists")

    tag = Tag(user_id=user_id, name=name, color=color)
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag


async def update_tag(
    db: AsyncSession,
    tag: Tag,
    name: str | None = None,
    color: str | None = None,
) -> Tag:
    if name is not None:
        tag.name = name
    if color is not None:
        tag.color = color
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag


async def delete_tag(db: AsyncSession, tag: Tag) -> None:
    await db.delete(tag)
    await db.flush()


async def get_tag(db: AsyncSession, user_id: UUID, tag_id: UUID) -> Tag | None:
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
    )
    return result.scalar_one_or_none()
