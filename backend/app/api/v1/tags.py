from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.tag import TagCreate, TagOut, TagUpdate
from app.services import tag_service

router = APIRouter(tags=["tags"])


@router.get(
    "/tags",
    response_model=list[TagOut],
    summary="List tags",
    description="Return all tags for the current user.",
)
async def list_tags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TagOut]:
    tags = await tag_service.list_tags(db, current_user.id)
    return [TagOut.model_validate(t) for t in tags]


@router.post(
    "/tags",
    response_model=TagOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create tag",
    description="Create a new tag for categorizing trades.",
    responses={201: {"description": "Tag created"}, 409: {"description": "Tag already exists"}},
)
async def create_tag(
    body: TagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TagOut:
    try:
        tag = await tag_service.create_tag(db, current_user.id, name=body.name, color=body.color)
        return TagOut.model_validate(tag)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch(
    "/tags/{tag_id}",
    response_model=TagOut,
    summary="Update tag",
    description="Update tag name and/or color.",
)
async def update_tag(
    tag_id: UUID,
    body: TagUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TagOut:
    tag = await tag_service.get_tag(db, current_user.id, tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    updated = await tag_service.update_tag(db, tag, name=body.name, color=body.color)
    return TagOut.model_validate(updated)


@router.delete(
    "/tags/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete tag",
    description="Permanently delete a tag.",
)
async def delete_tag(
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    tag = await tag_service.get_tag(db, current_user.id, tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await tag_service.delete_tag(db, tag)
