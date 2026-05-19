from __future__ import annotations

from typing import Any, Optional

import pandas as pd

from app.engine.liquidity import analyze_liquidity
from app.engine.market_structure import analyze_market_structure
from app.engine.order_blocks import analyze_order_blocks
from app.engine.target import compute_targets
from app.services.market_data import fetch_pda
from app.strategies.base import Signal, Strategy


class ICTOrderBlockStrategy(Strategy):
    @property
    def name(self) -> str:
        return "ICTOrderBlock"

    def warmup(self, df: pd.DataFrame) -> int:
        return 30

    def generate_signals(
        self,
        df: pd.DataFrame,
        current_index: int,
        ict_analysis: Optional[dict[str, Any]] = None,
    ) -> list[Signal]:
        window = df.iloc[: current_index + 1]
        if len(window) < self.warmup(df):
            return []

        symbol = getattr(df, "attrs", {}).get("symbol", "UNKNOWN")

        try:
            ms = analyze_market_structure(window)
            ob = analyze_order_blocks(window)
        except Exception:
            return []

        signals: list[Signal] = []

        if ms.get("bias") == "bullish":
            bullish_ob = ob.get("bullish_ob", {})
            if bullish_ob.get("valid") and not bullish_ob.get("mitigated", True):
                entry = (bullish_ob["high"] + bullish_ob["low"]) / 2.0
                sl = bullish_ob["low"]
                targets = [round(entry * 1.01, 2), round(entry * 1.02, 2), round(entry * 1.03, 2)]

                liq = self._get_liquidity(window)
                if liq and liq.get("nearest_bsl", 0) > 0:
                    targets = [
                        round(liq["nearest_bsl"], 2),
                        round(entry + (liq["nearest_bsl"] - entry) * 1.5, 2),
                    ]

                price = float(window["Close"].iloc[-1])
                distance_pct = abs(price - entry) / entry * 100
                if distance_pct < 0.5 and price >= entry * 0.995:
                    signals.append(
                        Signal(
                            action="BUY",
                            symbol=symbol,
                            entry_price=entry,
                            stop_loss=sl,
                            take_profit=targets,
                            confidence=min(1.0, 0.5 + 0.1 * ob.get("swing_count", 0)),
                            reason=f"Bullish OB {bullish_ob['low']}-{bullish_ob['high']}, "
                                   f"MS bias bullish",
                            timestamp=window.index[-1],
                        )
                    )

        elif ms.get("bias") == "bearish":
            bearish_ob = ob.get("bearish_ob", {})
            if bearish_ob.get("valid") and not bearish_ob.get("mitigated", True):
                entry = (bearish_ob["high"] + bearish_ob["low"]) / 2.0
                sl = bearish_ob["high"]
                targets = [round(entry * 0.99, 2), round(entry * 0.98, 2), round(entry * 0.97, 2)]

                liq = self._get_liquidity(window)
                if liq and liq.get("nearest_ssl", 0) > 0:
                    targets = [
                        round(liq["nearest_ssl"], 2),
                        round(entry - (entry - liq["nearest_ssl"]) * 1.5, 2),
                    ]

                price = float(window["Close"].iloc[-1])
                distance_pct = abs(price - entry) / entry * 100
                if distance_pct < 0.5 and price >= entry * 0.995:
                    signals.append(
                        Signal(
                            action="SELL",
                            symbol=symbol,
                            entry_price=entry,
                            stop_loss=sl,
                            take_profit=targets,
                            confidence=min(1.0, 0.5 + 0.1 * ob.get("swing_count", 0)),
                            reason=f"Bearish OB {bearish_ob['low']}-{bearish_ob['high']}, "
                                   f"MS bias bearish",
                            timestamp=window.index[-1],
                        )
                    )

        return signals

    @staticmethod
    def _get_liquidity(df: pd.DataFrame) -> Optional[dict[str, Any]]:
        try:
            pda = fetch_pda(
                getattr(df, "attrs", {}).get("symbol", "SPY")
            )
            return analyze_liquidity(df, pda)
        except Exception:
            return None
