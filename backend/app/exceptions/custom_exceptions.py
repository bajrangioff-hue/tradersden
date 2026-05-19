"""Custom exception classes with HTTP status codes."""

from typing import Any


class AppException(Exception):
    """Base exception for all application errors."""

    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    status_code: int = 500

    def __init__(self, details: str | None = None) -> None:
        self.details = details
        super().__init__(self.format_message())

    def format_message(self) -> str:
        """Format the exception message including details if present."""
        msg = self.message
        if self.details:
            msg = f"{msg}: {self.details}"
        return msg

    def __str__(self) -> str:
        return f"[{self.status_code}] {self.code}: {self.format_message()}"


class InvalidSymbolError(AppException):
    """Symbol format invalid or not supported."""

    code: str = "INVALID_SYMBOL"
    message: str = "Symbol format invalid or not supported"
    status_code: int = 400

    def __init__(self, symbol: str) -> None:
        self.symbol = symbol
        super().__init__(details=f"'{symbol}' is not a recognized symbol")


class SymbolNotFoundError(AppException):
    """Symbol data not available."""

    code: str = "SYMBOL_NOT_FOUND"
    message: str = "Symbol data not available"
    status_code: int = 404

    def __init__(self, symbol: str) -> None:
        self.symbol = symbol
        super().__init__(details=f"Market data for '{symbol}' could not be retrieved")


class DataFetchError(AppException):
    """Failed to fetch market data."""

    code: str = "FETCH_ERROR"
    message: str = "Failed to fetch market data, try again"
    status_code: int = 503


class ValidationError(AppException):
    """Invalid input parameters."""

    code: str = "VALIDATION_ERROR"
    message: str = "Invalid input parameters"
    status_code: int = 422


class ExternalAPIError(AppException):
    """External service unavailable."""

    code: str = "EXTERNAL_API_ERROR"
    message: str = "External service unavailable"
    status_code: int = 502


class RateLimitError(AppException):
    """Too many requests."""

    code: str = "RATE_LIMIT_EXCEEDED"
    message: str = "Too many requests, please wait"
    status_code: int = 429
