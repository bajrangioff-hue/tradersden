from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.confluence_level import ConfluenceLevel
from app.models.user import User
from app.schemas.confluence import (
    AnalyzeResponse,
    ConfluenceLevelOut,
    LevelCreate,
    LevelUpdate,
)
from app.services.confluence_service import analyze as run_confluence_analysis

router = APIRouter(tags=["confluence"])


@router.post(
    "/confluence/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze symbol for confluence",
    description="Run all 8 ICT engines on a symbol, extract levels, compute confluence scores. Does NOT persist.",
)
async def analyze_confluence(
    symbol: str = Query(..., min_length=2, max_length=15, examples=["SPY"]),
    interval: str = Query("1h", pattern="^(1m|5m|15m|1h|4h|1d)$"),
    period: str = Query("1mo"),
    current_user: User = Depends(get_current_user),
) -> AnalyzeResponse:
    result = await run_confluence_analysis(symbol, interval=interval, period=period)
    levels = [ConfluenceLevelOut(**lvl) for lvl in result["levels"]]
    return AnalyzeResponse(
        symbol=result["symbol"],
        interval=result["interval"],
        levels=levels,
        score=result["score"],
        direction=result["direction"],
        grade=result["grade"],
        narrative=result["narrative"],
        full_analysis=result["full_analysis"],
    )


@router.post(
    "/confluence/analyze-and-save",
    response_model=AnalyzeResponse,
    summary="Analyze and persist levels",
    description="Run confluence analysis and persist the detected levels to the database.",
)
async def analyze_and_save(
    symbol: str = Query(..., min_length=2, max_length=15, examples=["SPY"]),
    interval: str = Query("1h", pattern="^(1m|5m|15m|1h|4h|1d)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyzeResponse:
    result = await run_confluence_analysis(symbol, interval=interval)

    for lvl in result["levels"]:
        cl = ConfluenceLevel(
            user_id=current_user.id,
            symbol=symbol.upper(),
            level_type=lvl["level_type"],
            price=lvl["price"],
            high=lvl.get("high"),
            low=lvl.get("low"),
            direction=lvl.get("direction"),
            confluence_score=lvl["confluence_score"],
            strength=lvl.get("strength", "weak"),
            source_modules=lvl.get("source_modules"),
            time_frame=interval,
            is_mitigated=lvl.get("is_mitigated", False),
            notes="",
        )
        db.add(cl)
    await db.flush()

    levels = [ConfluenceLevelOut(**lvl) for lvl in result["levels"]]
    return AnalyzeResponse(
        symbol=result["symbol"],
        interval=result["interval"],
        levels=levels,
        score=result["score"],
        direction=result["direction"],
        grade=result["grade"],
        narrative=result["narrative"],
        full_analysis=result["full_analysis"],
    )


@router.get(
    "/confluence/levels",
    response_model=list[ConfluenceLevelOut],
    summary="Saved levels",
    description="Return saved confluence levels for a symbol (user-scoped).",
)
async def list_levels(
    symbol: str = Query(..., min_length=1, max_length=20),
    tf: str | None = Query(None, alias="time_frame"),
    mitigated: bool | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConfluenceLevelOut]:
    stmt = select(ConfluenceLevel).where(
        ConfluenceLevel.user_id == current_user.id,
        ConfluenceLevel.symbol == symbol.upper(),
    )
    if tf:
        stmt = stmt.where(ConfluenceLevel.time_frame == tf)
    if mitigated is not None:
        stmt = stmt.where(ConfluenceLevel.is_mitigated == mitigated)
    stmt = stmt.order_by(ConfluenceLevel.detected_at.desc())

    result = await db.execute(stmt)
    return [ConfluenceLevelOut.model_validate(c) for c in result.scalars().all()]


@router.patch(
    "/confluence/levels/{level_id}",
    response_model=ConfluenceLevelOut,
    summary="Update level",
    description="Update notes, favorite, or mitigate status on a saved level.",
)
async def update_level(
    level_id: UUID,
    body: LevelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConfluenceLevelOut:
    result = await db.execute(
        select(ConfluenceLevel).where(
            ConfluenceLevel.id == level_id,
            ConfluenceLevel.user_id == current_user.id,
        )
    )
    level = result.scalar_one_or_none()
    if level is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Level not found")
    if body.notes is not None:
        level.notes = body.notes
    if body.is_favorite is not None:
        level.is_favorite = body.is_favorite
    if body.is_mitigated is not None:
        level.is_mitigated = body.is_mitigated
    db.add(level)
    await db.flush()
    await db.refresh(level)
    return ConfluenceLevelOut.model_validate(level)


@router.delete(
    "/confluence/levels/{level_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete level",
    description="Remove a saved confluence level.",
)
async def delete_level(
    level_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(ConfluenceLevel).where(
            ConfluenceLevel.id == level_id,
            ConfluenceLevel.user_id == current_user.id,
        )
    )
    level = result.scalar_one_or_none()
    if level is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Level not found")
    await db.delete(level)
    await db.flush()
