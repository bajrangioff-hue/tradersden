from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.preferences import UserPreference
from app.models.user import User


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user(
    db: AsyncSession,
    user: User,
    display_name: str | None = None,
    avatar_url: str | None = None,
) -> User:
    if display_name is not None:
        user.display_name = display_name
    if avatar_url is not None:
        user.avatar_url = avatar_url
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def get_preferences(db: AsyncSession, user_id: UUID) -> dict:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == user_id)
    )
    pref = result.scalar_one_or_none()
    return pref.preferences if pref else {}


async def update_preferences(
    db: AsyncSession,
    user_id: UUID,
    preferences: dict,
) -> dict:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == user_id)
    )
    pref = result.scalar_one_or_none()
    if pref is None:
        pref = UserPreference(user_id=user_id, preferences=preferences)
    else:
        pref.preferences = {**pref.preferences, **preferences}
    db.add(pref)
    await db.flush()

    if pref.preferences is None:
        pref.preferences = {}
    return pref.preferences
