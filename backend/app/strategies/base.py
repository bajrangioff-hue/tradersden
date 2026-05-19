from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

import pandas as pd


@dataclass
class Signal:
    action: str
    symbol: str
    entry_price: float
    stop_loss: float
    take_profit: list[float] = field(default_factory=list)
    quantity: Optional[float] = None
    confidence: float = 0.0
    reason: str = ""
    timestamp: Optional[pd.Timestamp] = None


class Strategy(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def generate_signals(
        self,
        df: pd.DataFrame,
        current_index: int,
        ict_analysis: Optional[dict[str, Any]] = None,
    ) -> list[Signal]:
        ...

    def warmup(self, df: pd.DataFrame) -> int:
        return 30
