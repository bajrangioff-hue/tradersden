"""Global exception handler for custom application exceptions."""

import logging
import traceback

from fastapi import Request
from fastapi.responses import JSONResponse

from app.exceptions.custom_exceptions import AppException
from app.utils.response import error_response

logger = logging.getLogger("tradepro.api")


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle all custom AppException subclasses.

    Args:
        request: The incoming HTTP request.
        exc: The raised application exception.

    Returns:
        JSONResponse with a standardized error payload.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        "AppException [%s] %s %s | %s | %s",
        request_id,
        request.method,
        request.url.path,
        exc.code,
        traceback.format_exc(),
    )
    payload = error_response(code=exc.code, message=exc.format_message())
    return JSONResponse(status_code=exc.status_code, content=payload)
