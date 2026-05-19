from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class RiskConfig:
    max_position_size_pct: float = 25.0
    max_total_risk_pct: float = 5.0
    max_daily_loss_pct: float = 3.0
    max_consecutive_losses: int = 5
    max_open_positions: int = 3
    default_sl_atr_multiplier: float = 1.5
    default_tp_atr_multiplier: float = 3.0
    trailing_stop_activation_pct: float = 1.0
    trailing_stop_distance_pct: float = 0.5


class RiskManager:
    def __init__(self, config: Optional[RiskConfig] = None):
        self.config = config or RiskConfig()
        self.daily_pnl: float = 0.0
        self.consecutive_losses: int = 0
        self.open_positions: int = 0

    def can_open_position(self, capital: float, position_cost: float) -> tuple[bool, str]:
        if self.open_positions >= self.config.max_open_positions:
            return False, "Max open positions reached"
        position_pct = (position_cost / max(capital, 1.0)) * 100
        if position_pct > self.config.max_position_size_pct:
            return False, f"Position size {position_pct:.1f}% exceeds limit"
        return True, "OK"

    def check_daily_loss(self, capital: float, starting_capital: float) -> tuple[bool, str]:
        if starting_capital <= 0:
            return True, "OK"
        loss_pct = (starting_capital - capital) / starting_capital * 100
        if loss_pct > self.config.max_daily_loss_pct:
            return False, f"Daily loss {loss_pct:.1f}% exceeds limit"
        return True, "OK"

    def register_trade_result(self, pnl: float) -> None:
        self.daily_pnl += pnl
        if pnl <= 0:
            self.consecutive_losses += 1
        else:
            self.consecutive_losses = 0

    def reset_daily(self) -> None:
        self.daily_pnl = 0.0
        self.consecutive_losses = 0
