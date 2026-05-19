from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.execution.base import Account, ExchangeAdapter, Order, Position


class PaperExchange(ExchangeAdapter):
    def __init__(self, initial_capital: float = 100_000.0):
        self._cash = initial_capital
        self._positions: dict[str, Position] = {}
        self._orders: list[Order] = []
        self._prices: dict[str, float] = {}

    def update_price(self, symbol: str, price: float) -> None:
        self._prices[symbol.upper()] = price
        pos = self._positions.get(symbol.upper())
        if pos:
            pos.current_price = price
            if pos.side == "LONG":
                pos.unrealized_pnl = (price - pos.entry_price) * pos.quantity
            else:
                pos.unrealized_pnl = (pos.entry_price - price) * pos.quantity

    async def place_order(self, order: Order) -> Order:
        order.id = str(uuid.uuid4())
        order.created_at = datetime.now(timezone.utc).isoformat()
        price = self._prices.get(order.symbol.upper(), order.price or 0.0)

        order.status = "filled"
        order.filled_price = price
        order.filled_quantity = order.quantity
        order.filled_at = datetime.now(timezone.utc).isoformat()

        if order.side.upper() == "BUY":
            cost = price * order.quantity
            if cost > self._cash:
                order.status = "rejected"
                return order
            self._cash -= cost
            existing = self._positions.get(order.symbol.upper())
            if existing:
                total_qty = existing.quantity + order.quantity
                existing.entry_price = (
                    existing.entry_price * existing.quantity + price * order.quantity
                ) / total_qty
                existing.quantity = total_qty
            else:
                self._positions[order.symbol.upper()] = Position(
                    symbol=order.symbol.upper(),
                    side="LONG",
                    quantity=order.quantity,
                    entry_price=price,
                    current_price=price,
                )
        elif order.side.upper() == "SELL":
            existing = self._positions.get(order.symbol.upper())
            if not existing or existing.quantity < order.quantity:
                order.status = "rejected"
                return order
            existing.quantity -= order.quantity
            realized = (price - existing.entry_price) * order.quantity
            existing.realized_pnl += realized
            self._cash += price * order.quantity
            if existing.quantity <= 0:
                del self._positions[order.symbol.upper()]

        self._orders.append(order)
        return order

    async def cancel_order(self, order_id: str) -> bool:
        for order in self._orders:
            if order.id == order_id and order.status == "pending":
                order.status = "cancelled"
                return True
        return False

    async def get_position(self, symbol: str) -> Optional[Position]:
        return self._positions.get(symbol.upper())

    async def get_account(self) -> Account:
        pos_list = list(self._positions.values())
        unrealized = sum(p.unrealized_pnl for p in pos_list)
        return Account(
            total_equity=round(self._cash + unrealized, 2),
            cash=round(self._cash, 2),
            positions=pos_list,
            buying_power=round(self._cash, 2),
        )

    async def get_price(self, symbol: str) -> float:
        return self._prices.get(symbol.upper(), 0.0)
