from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class Order:
    id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: str = "pending"
    filled_price: Optional[float] = None
    filled_quantity: float = 0.0
    created_at: Optional[str] = None
    filled_at: Optional[str] = None
    reason: str = ""


@dataclass
class Position:
    symbol: str
    side: str
    quantity: float
    entry_price: float
    current_price: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0


@dataclass
class Account:
    total_equity: float = 0.0
    cash: float = 0.0
    positions: list[Position] = field(default_factory=list)
    buying_power: float = 0.0


class ExchangeAdapter(ABC):
    @abstractmethod
    async def place_order(self, order: Order) -> Order:
        ...

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        ...

    @abstractmethod
    async def get_position(self, symbol: str) -> Optional[Position]:
        ...

    @abstractmethod
    async def get_account(self) -> Account:
        ...

    @abstractmethod
    async def get_price(self, symbol: str) -> float:
        ...
