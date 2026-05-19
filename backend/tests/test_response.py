"""Tests for response formatting utilities."""

from app.utils.response import success_response, error_response


def test_success_response() -> None:
    result = success_response({"foo": "bar"})
    assert result["status"] == "success"
    assert result["data"]["foo"] == "bar"
    assert "meta" in result
    assert "timestamp" in result["meta"]
    assert result["meta"]["version"] == "2.0"


def test_error_response() -> None:
    result = error_response("TEST_ERROR", "Something went wrong", details="detail info")
    assert result["status"] == "error"
    assert result["error"]["code"] == "TEST_ERROR"
    assert result["error"]["message"] == "Something went wrong"
    assert result["error"]["details"] == "detail info"
    assert "meta" in result


def test_error_response_no_details() -> None:
    result = error_response("CODE", "Message")
    assert result["error"]["code"] == "CODE"
    assert "details" not in result["error"]
