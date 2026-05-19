"""Health check route handler."""

from fastapi import APIRouter

from app.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    description="Returns current API status and version. No rate limiting applied.",
    responses={
        200: {"description": "Service is healthy"},
    },
)
async def health_check() -> HealthResponse:
    """Return service health status.

    Returns:
        HealthResponse with status 'ok' and current version.
    """
    return HealthResponse(status="ok", version=settings.APP_VERSION)
