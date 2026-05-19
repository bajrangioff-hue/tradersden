"""Standardized response formatting utilities."""

from datetime import datetime, timezone

from typing import Any


def success_response(data: dict[str, Any], version: str = "2.0") -> dict[str, Any]:
    """Build a standardized success response.

    Args:
        data: The payload to return under the 'data' key.
        version: API version string (default '2.0').

    Returns:
        Dict with status, data, and meta keys.
    """
    return {
        "status": "success",
        "data": data,
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": version,
        },
    }


def error_response(
    code: str,
    message: str,
    details: str | None = None,
    version: str = "2.0",
) -> dict[str, Any]:
    """Build a standardized error response.

    Args:
        code: Machine-readable error code (e.g. 'INVALID_SYMBOL').
        message: Human-readable error message.
        details: Optional detailed error information.
        version: API version string (default '2.0').

    Returns:
        Dict with status, error, and meta keys.
    """
    error: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return {
        "status": "error",
        "error": error,
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": version,
        },
    }
