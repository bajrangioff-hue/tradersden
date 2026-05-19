from __future__ import annotations

import math
from typing import Optional


def fixed_quantity(capital: float, qty: float) -> float:
    return qty


def percent_capital(capital: float, percent: float, price: float) -> float:
    amount = capital * (percent / 100.0)
    return math.floor(amount / max(price, 0.01))


def risk_based(
    capital: float,
    risk_percent: float,
    entry_price: float,
    stop_loss: float,
) -> float:
    risk_amount = capital * (risk_percent / 100.0)
    risk_per_share = abs(entry_price - stop_loss)
    if risk_per_share <= 0:
        return 0.0
    return math.floor(risk_amount / risk_per_share)


def kelly_criterion(win_rate: float, avg_win: float, avg_loss: float) -> float:
    if avg_loss <= 0:
        return 0.0
    b = avg_win / avg_loss
    p = win_rate
    q = 1.0 - p
    kelly = (p * b - q) / b
    return max(0.0, min(kelly, 0.25))
