from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    display_name: str | None = None,
) -> dict[str, Any]:
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ValueError("Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name or email.split("@")[0],
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    tokens = await _issue_tokens(db, user)
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        **tokens,
    }


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> dict[str, Any]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or user.password_hash is None:
        raise ValueError("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")
    if not user.is_active:
        raise ValueError("Account is deactivated")

    await db.refresh(user)
    tokens = await _issue_tokens(db, user)
    return {"id": str(user.id), "email": user.email, **tokens}


async def refresh_access_token(
    db: AsyncSession,
    refresh_token_str: str,
) -> dict[str, str]:
    payload = decode_token(refresh_token_str)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if user_id is None or token_type != "refresh":
        raise ValueError("Invalid refresh token")

    token_hash = _hash_token(refresh_token_str)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user_id,
        )
    )
    stored = result.scalar_one_or_none()
    if stored is None or stored.expires_at < datetime.now(timezone.utc):
        raise ValueError("Refresh token expired or revoked")

    await db.delete(stored)

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise ValueError("User not found")

    tokens = await _issue_tokens(db, user)
    return tokens


async def logout_user(db: AsyncSession, user_id: str) -> None:
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user_id)
    )
    for rt in result.scalars().all():
        await db.delete(rt)


async def _issue_tokens(
    db: AsyncSession,
    user: User,
) -> dict[str, str]:
    now = datetime.now(timezone.utc)
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})

    token_hash = _hash_token(refresh)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=now + timedelta(days=7),
        )
    )
    await db.flush()

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
    }


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
