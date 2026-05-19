from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.backtesting.engine import BacktestResult


def calculate_sharpe(
    returns: list[float],
    risk_free_rate: float = 0.0,
    periods_per_year: int = 252,
) -> float:
    if len(returns) < 2:
        return 0.0
    arr = np.array(returns)
    excess = arr - risk_free_rate / periods_per_year
    if np.std(excess) == 0:
        return 0.0
    return float(np.mean(excess) / np.std(excess) * np.sqrt(periods_per_year))


def calculate_max_drawdown(equity_curve: pd.Series) -> float:
    if len(equity_curve) < 2:
        return 0.0
    peak = equity_curve.expanding().max()
    dd = (equity_curve - peak) / peak
    return float(abs(dd.min()))


def calculate_sortino(
    returns: list[float],
    risk_free_rate: float = 0.0,
    periods_per_year: int = 252,
) -> float:
    if len(returns) < 2:
        return 0.0
    arr = np.array(returns)
    excess = arr - risk_free_rate / periods_per_year
    downside = excess[excess < 0]
    if len(downside) == 0 or np.std(downside) == 0:
        return 0.0
    return float(np.mean(excess) / np.std(downside) * np.sqrt(periods_per_year))


def describe(result: BacktestResult) -> dict[str, Any]:
    return result.summary()
