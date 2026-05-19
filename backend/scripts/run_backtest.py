"""Minimal backtest runner — fetches data, runs ICTOrderBlockStrategy, prints P&L."""

from app.backtesting.engine import BacktestEngine
from app.services.market_data import fetch_data
from app.strategies.ict_order_block import ICTOrderBlockStrategy


def main():
    symbol = "SPY"
    print(f"Fetching data for {symbol}...")
    df = fetch_data(symbol, interval="1h", period="3mo")
    df.attrs["symbol"] = symbol
    print(f"Loaded {len(df)} bars\n")

    strategy = ICTOrderBlockStrategy()
    engine = BacktestEngine(strategy, initial_capital=10_000.0, commission=0.001)
    result = engine.run(df, symbol=symbol)

    summary = result.summary()
    print("=== BACKTEST SUMMARY ===")
    for k, v in summary.items():
        print(f"  {k}: {v}")

    print(f"\n=== TRADE LOG (last 15) ===")
    print(
        f"{'Entry':>20} {'Exit':>20} {'Action':>6} {'Entry$':>8} "
        f"{'Exit$':>8} {'P&L':>8} {'P&L%':>7} {'Reason':>10} {'Bars':>4}"
    )
    for t in result.trades[-15:]:
        et = t.entry_time.strftime("%Y-%m-%d %H:%M")[:16]
        ext = t.exit_time.strftime("%Y-%m-%d %H:%M")[:16]
        pnl_pct_s = f"{t.pnl_pct * 100:+.2f}%"
        print(
            f"{et:>20} {ext:>20} {t.action:>6} {t.entry_price:>8.2f} "
            f"{t.exit_price:>8.2f} {t.pnl:>+8.2f} {pnl_pct_s:>7} {t.exit_reason:>10} {t.bars_held:>4}"
        )

    print(f"\nTotal trades: {result.total_trades}")
    print(f"Final equity: ${result.final_capital:,.2f}")
    print(f"Return: {result.total_return * 100:+.2f}%")


if __name__ == "__main__":
    main()
