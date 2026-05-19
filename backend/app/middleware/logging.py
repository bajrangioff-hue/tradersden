"""Request logging middleware with timing and request IDs."""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("tradepro.api")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with method, path, status, timing, client info."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        start = time.perf_counter()

        response: Response = await call_next(request)

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        log_line = (
            f"{request_id} | {request.method} {request.url.path} "
            f"| {response.status_code} | {elapsed_ms}ms "
            f"| {client_ip} | {user_agent}"
        )

        if response.status_code >= 500:
            logger.error(log_line)
        elif response.status_code >= 400:
            logger.warning(log_line)
        else:
            logger.info(log_line)

        response.headers["X-Request-Id"] = request_id
        return response
