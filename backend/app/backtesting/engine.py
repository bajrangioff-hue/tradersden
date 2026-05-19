from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np
import pandas as pd

from app.strategies.base import Signal, Strategy

logger = logging.getLogger("tradepro.backtest")


@dataclass
class TradeLog:
    entry_time: pd.Timestamp
    exit_time: pd.Timestamp
    action: str
    entry_price: float
    exit_price: float
    quantity: float
    pnl: float
    pnl_pct: float
    exit_reason: str
    bars_held: int
    confidence: float = 0.0
    reason: str = ""


@dataclass
class BacktestResult:
    trades: list[TradeLog] = field(default_factory=list)
    equity_curve: Optional[pd.Series] = None
    total_return: float = 0.0
    total_trades: int = 0
    initial_capital: float = 0.0
    final_capital: float = 0.0

    def summary(self) -> dict[str, Any]:
        returns = self._compute_returns()
        winning = [t for t in self.trades if t.pnl > 0]
        losing = [t for t in self.trades if t.pnl <= 0]
        gross_profit = sum(t.pnl for t in winning)
        gross_loss = abs(sum(t.pnl for t in losing)) if losing else 1
        return {
            "symbol": self.trades[0].action if self.trades else "N/A",
            "total_trades": self.total_trades,
            "win_rate": round(len(winning) / max(self.total_trades, 1), 4),
            "total_return_pct": round(self.total_return * 100, 2),
            "profit_factor": round(gross_profit / max(gross_loss, 0.01), 2),
            "avg_win_pct": round(np.mean([t.pnl_pct for t in winning]) * 100, 2) if winning else 0.0,
            "avg_loss_pct": round(np.mean([t.pnl_pct for t in losing]) * 100, 2) if losing else 0.0,
            "max_consecutive_losses": self._max_consecutive_losses(),
            "sharpe_ratio": round(self._sharpe_ratio(returns), 4),
            "max_drawdown_pct": round(self._max_drawdown() * 100, 2),
            "initial_capital": round(self.initial_capital, 2),
            "final_capital": round(self.final_capital, 2),
        }

    def _compute_returns(self) -> list[float]:
        return [t.pnl_pct for t in self.trades]

    def _sharpe_ratio(self, returns: list[float], risk_free: float = 0.0) -> float:
        if len(returns) < 2:
            return 0.0
        arr = np.array(returns)
        excess = arr - risk_free / len(returns)
        if np.std(excess) == 0:
            return 0.0
        return float(np.mean(excess) / np.std(excess) * np.sqrt(252))

    def _max_drawdown(self) -> float:
        if self.equity_curve is None or len(self.equity_curve) < 2:
            return 0.0
        peak = self.equity_curve.expanding().max()
        dd = (self.equity_curve - peak) / peak
        return float(abs(dd.min()))

    def _max_consecutive_losses(self) -> int:
        streak = 0
        max_streak = 0
        for t in self.trades:
            if t.pnl <= 0:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 0
        return max_streak


class BacktestEngine:
    def __init__(
        self,
        strategy: Strategy,
        initial_capital: float = 10_000.0,
        commission: float = 0.001,
        slippage: float = 0.0005,
    ):
        self.strategy = strategy
        self.initial_capital = initial_capital
        self.commission = commission
        self.slippage = slippage

    def run(
        self,
        df: pd.DataFrame,
        symbol: Optional[str] = None,
    ) -> BacktestResult:
        df = df.copy()
        if "symbol" not in df.attrs and symbol:
            df.attrs["symbol"] = symbol
        if "symbol" not in df.attrs:
            df.attrs["symbol"] = "SYMBOL"

        warmup = self.strategy.warmup(df)
        capital = self.initial_capital
        position: Optional[dict[str, Any]] = None
        trades: list[TradeLog] = []
        equity: list[float] = [capital]

        for i in range(warmup, len(df)):
            current_bar = df.iloc[i]

            if position is not None:
                self._check_stop_take_profit(position, current_bar, df.index[i], trades)
                if position.get("closed"):
                    capital = position["capital"]
                    position = None

            if position is None:
                signals = self.strategy.generate_signals(df, i)
                best = self._pick_best_signal(signals)
                if best is not None and best.action in ("BUY", "SELL"):
                    entry_price = self._apply_slippage(best.entry_price, best.action)
                    cost = entry_price * self.commission
                    position = {
                        "action": best.action,
                        "entry_price": entry_price,
                        "entry_time": df.index[i],
                        "quantity": best.quantity or 1,
                        "stop_loss": best.stop_loss,
                        "take_profit": sorted(best.take_profit) if best.take_profit else [],
                        "confidence": best.confidence,
                        "reason": best.reason,
                        "capital": capital,
                        "closed": False,
                        "entry_cost": cost,
                        "bars_held": 0,
                    }
                    capital -= cost

            if position is not None:
                position["bars_held"] += 1

            equity.append(self._current_equity(capital, position, current_bar))

        if position is not None and not position.get("closed"):
            current_bar = df.iloc[-1]
            self._close_position(
                position,
                float(current_bar["Close"]),
                df.index[-1],
                "END_OF_DATA",
                trades,
                capital,
            )
            capital = position["capital"]

        result = BacktestResult(
            trades=trades,
            total_trades=len(trades),
            initial_capital=self.initial_capital,
            final_capital=capital,
            total_return=(capital - self.initial_capital) / self.initial_capital,
        )
        result.equity_curve = pd.Series(
            equity, index=[df.index[0]] + list(df.index[warmup:])
        )
        return result

    def _pick_best_signal(self, signals: list[Signal]) -> Optional[Signal]:
        if not signals:
            return None
        trade_signals = [s for s in signals if s.action in ("BUY", "SELL")]
        if not trade_signals:
            return None
        return max(trade_signals, key=lambda s: s.confidence)

    def _apply_slippage(self, price: float, action: str) -> float:
        if action == "BUY":
            return round(price * (1 + self.slippage), 2)
        return round(price * (1 - self.slippage), 2)

    def _check_stop_take_profit(
        self,
        position: dict[str, Any],
        bar: pd.Series,
        bar_time: pd.Timestamp,
        trades: list[TradeLog],
    ) -> None:
        if position.get("closed"):
            return
        high = float(bar["High"])
        low = float(bar["Low"])
        sl = position["stop_loss"]
        tps = position["take_profit"]

        if position["action"] == "BUY":
            if low <= sl:
                self._close_position(position, min(sl, low), bar_time, "SL", trades)
                return
            for tp in tps:
                if high >= tp:
                    self._close_position(position, tp, bar_time, "TP", trades)
                    return
        else:
            if high >= sl:
                self._close_position(position, max(sl, high), bar_time, "SL", trades)
                return
            for tp in tps:
                if low <= tp:
                    self._close_position(position, tp, bar_time, "TP", trades)

    def _close_position(
        self,
        position: dict[str, Any],
        exit_price: float,
        exit_time: pd.Timestamp,
        exit_reason: str,
        trades: list[TradeLog],
        current_capital: float = 0.0,
    ) -> None:
        if position.get("closed"):
            return
        action = position["action"]
        entry = position["entry_price"]
        qty = position["quantity"]
        commission_cost = exit_price * self.commission

        if action == "BUY":
            pnl = (exit_price - entry) * qty - commission_cost - position.get("entry_cost", 0)
            pnl_pct = (exit_price - entry) / entry
        else:
            pnl = (entry - exit_price) * qty - commission_cost - position.get("entry_cost", 0)
            pnl_pct = (entry - exit_price) / entry

        base_capital = position.get("capital", current_capital)
        position["capital"] = base_capital + pnl
        position["closed"] = True

        trades.append(
            TradeLog(
                entry_time=position["entry_time"],
                exit_time=exit_time,
                action=action,
                entry_price=entry,
                exit_price=exit_price,
                quantity=qty,
                pnl=round(pnl, 2),
                pnl_pct=round(pnl_pct, 4),
                exit_reason=exit_reason,
                bars_held=position.get("bars_held", 0),
                confidence=position.get("confidence", 0.0),
                reason=position.get("reason", ""),
            )
        )

    @staticmethod
    def _current_equity(
        capital: float,
        position: Optional[dict[str, Any]],
        current_bar: pd.Series,
    ) -> float:
        if position is None or position.get("closed"):
            return capital
        current_price = float(current_bar["Close"])
        entry = position["entry_price"]
        qty = position["quantity"]
        if position["action"] == "BUY":
            unrealized = (current_price - entry) * qty
        else:
            unrealized = (entry - current_price) * qty
        return capital + unrealized
