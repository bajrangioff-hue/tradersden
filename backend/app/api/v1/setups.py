from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.saved_setup import SavedSetup
from app.models.user import User
from app.schemas.setup import SetupCreate, SetupOut

router = APIRouter(tags=["setups"])


@router.get(
    "/setups",
    response_model=list[SetupOut],
    summary="List saved setups",
    description="Return all saved analysis setups for the current user.",
)
async def list_setups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SetupOut]:
    result = await db.execute(
        select(SavedSetup)
        .where(SavedSetup.user_id == current_user.id)
        .order_by(SavedSetup.created_at.desc())
    )
    return [SetupOut.model_validate(s) for s in result.scalars().all()]


@router.post(
    "/setups",
    response_model=SetupOut,
    status_code=status.HTTP_201_CREATED,
    summary="Save setup",
    description="Save the current analysis snapshot as a named setup.",
)
async def create_setup(
    body: SetupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SetupOut:
    level_ids_list: list[UUID] = []
    for lid in body.level_ids:
        try:
            level_ids_list.append(UUID(lid))
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid level_id: {lid}")

    setup = SavedSetup(
        user_id=current_user.id,
        symbol=body.symbol.upper(),
        title=body.title,
        notes=body.notes,
        analysis_snapshot=body.analysis_snapshot,
        level_ids=level_ids_list,
    )
    db.add(setup)
    await db.flush()
    await db.refresh(setup)
    return SetupOut.model_validate(setup)


@router.get(
    "/setups/{setup_id}",
    response_model=SetupOut,
    summary="Get setup",
    description="Return a single saved setup by ID.",
)
async def get_setup(
    setup_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SetupOut:
    result = await db.execute(
        select(SavedSetup).where(
            SavedSetup.id == setup_id,
            SavedSetup.user_id == current_user.id,
        )
    )
    setup = result.scalar_one_or_none()
    if setup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setup not found")
    return SetupOut.model_validate(setup)


@router.delete(
    "/setups/{setup_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete setup",
    description="Remove a saved setup.",
)
async def delete_setup(
    setup_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(SavedSetup).where(
            SavedSetup.id == setup_id,
            SavedSetup.user_id == current_user.id,
        )
    )
    setup = result.scalar_one_or_none()
    if setup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setup not found")
    await db.delete(setup)
    await db.flush()
