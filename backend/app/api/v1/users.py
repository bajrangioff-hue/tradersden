from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import PreferencesUpdate, UserOut, UserUpdateRequest
from app.services import user_service

router = APIRouter(tags=["users"])


@router.patch(
    "/users/me",
    response_model=UserOut,
    summary="Update profile",
    description="Update display name and/or avatar URL.",
)
async def update_profile(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    updated = await user_service.update_user(
        db,
        user=current_user,
        display_name=body.display_name,
        avatar_url=body.avatar_url,
    )
    return UserOut(
        id=str(updated.id),
        email=updated.email,
        display_name=updated.display_name,
        avatar_url=updated.avatar_url,
        is_verified=updated.is_verified,
        created_at=updated.created_at,
    )


@router.get(
    "/users/me/preferences",
    summary="Get preferences",
    description="Return user preferences as a JSON object.",
)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    prefs = await user_service.get_preferences(db, current_user.id)
    return {"preferences": prefs}


@router.put(
    "/users/me/preferences",
    summary="Update preferences",
    description="Merge provided keys into user preferences.",
)
async def update_preferences(
    body: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    prefs = await user_service.update_preferences(db, current_user.id, body.preferences)
    return {"preferences": prefs}
