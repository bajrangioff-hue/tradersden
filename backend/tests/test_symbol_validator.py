"""Tests for the symbol validator."""

import pytest

from app.validators.symbol_validator import (
    validate_format,
    is_whitelisted,
    validate_symbol,
    InvalidSymbolError,
)


def test_validate_format_valid() -> None:
    assert validate_format("SPY") is True
    assert validate_format("MNQ=F") is True
    assert validate_format("EURUSD=X") is True
    assert validate_format("BTC-USD") is True
    assert validate_format("RELIANCE.NS") is True
    assert validate_format("NIFTY50=F") is True
    assert validate_format("^GSPC") is True


def test_validate_format_invalid() -> None:
    assert validate_format("") is False
    assert validate_format("A") is False
    assert validate_format("TOO_LONG_SYMBOL_123") is False
    assert validate_format("SPY!") is False
    assert validate_format("SPY@123") is False


def test_is_whitelisted() -> None:
    assert is_whitelisted("SPY") is True
    assert is_whitelisted("MNQ=F") is True
    assert is_whitelisted("BTC-USD") is True
    assert is_whitelisted("AAPL") is True
    assert is_whitelisted("spy") is True
    assert is_whitelisted("INVALID_SYM") is False
    assert is_whitelisted("ZZZZZ") is False


def test_validate_symbol_valid() -> None:
    assert validate_symbol("SPY") is True
    assert validate_symbol("MNQ=F") is True
    assert validate_symbol("BTC-USD") is True


def test_validate_symbol_raises() -> None:
    with pytest.raises(InvalidSymbolError):
        validate_symbol("INVALID_SYM")
    with pytest.raises(InvalidSymbolError):
        validate_symbol("X")
    with pytest.raises(InvalidSymbolError):
        validate_symbol("SPY!")
