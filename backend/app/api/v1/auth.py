from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.middleware.rate_limiter import limiter
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create account",
    description="Register with email + password. Returns JWT tokens.",
    responses={201: {"description": "User created"}, 409: {"description": "Email already registered"}},
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        result = await auth_service.register_user(
            db, email=body.email, password=body.password, display_name=body.display_name
        )
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate with email + password. Returns JWT tokens.",
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        result = await auth_service.authenticate_user(db, email=body.email, password=body.password)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post(
    "/auth/refresh",
    response_model=TokenResponse,
    summary="Refresh tokens",
    description="Exchange a valid refresh token for a new access + refresh token pair.",
)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        result = await auth_service.refresh_access_token(db, refresh_token_str=body.refresh_token)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.post(
    "/auth/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout",
    description="Invalidate all refresh tokens for the current user.",
)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await auth_service.logout_user(db, str(current_user.id))


@router.get(
    "/auth/me",
    response_model=UserOut,
    summary="Current user",
    description="Return the authenticated user's profile.",
)
async def me(
    current_user: User = Depends(get_current_user),
) -> UserOut:
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
    )
