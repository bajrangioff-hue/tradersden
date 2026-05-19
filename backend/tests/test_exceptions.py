"""Tests for custom exception classes."""

from app.exceptions.custom_exceptions import (
    AppException,
    InvalidSymbolError,
    SymbolNotFoundError,
    DataFetchError,
    ValidationError,
    ExternalAPIError,
    RateLimitError,
)


def test_base_exception() -> None:
    exc = AppException()
    assert exc.code == "INTERNAL_ERROR"
    assert exc.status_code == 500
    assert "INTERNAL_ERROR" in str(exc)


def test_invalid_symbol_error() -> None:
    exc = InvalidSymbolError("ZZZZZ")
    assert exc.code == "INVALID_SYMBOL"
    assert exc.status_code == 400
    assert "ZZZZZ" in str(exc)


def test_symbol_not_found_error() -> None:
    exc = SymbolNotFoundError("SPY")
    assert exc.code == "SYMBOL_NOT_FOUND"
    assert exc.status_code == 404
    assert "SPY" in str(exc)


def test_data_fetch_error() -> None:
    exc = DataFetchError("Connection timeout")
    assert exc.code == "FETCH_ERROR"
    assert exc.status_code == 503
    assert "Connection timeout" in str(exc)


def test_validation_error() -> None:
    exc = ValidationError()
    assert exc.code == "VALIDATION_ERROR"
    assert exc.status_code == 422


def test_external_api_error() -> None:
    exc = ExternalAPIError()
    assert exc.code == "EXTERNAL_API_ERROR"
    assert exc.status_code == 502


def test_rate_limit_error() -> None:
    exc = RateLimitError()
    assert exc.code == "RATE_LIMIT_EXCEEDED"
    assert exc.status_code == 429


def test_exception_with_details() -> None:
    exc = AppException(details="Extra info")
    assert exc.details == "Extra info"
    assert "Extra info" in exc.format_message()
