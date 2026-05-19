import React from 'react';
import { X } from 'lucide-react';
import type { TradeOut } from '../../types';

interface DailyTradesListProps {
  trades: TradeOut[];
  date: string;
  onClose: () => void;
}

const OUTCOME_COLORS: Record<string, string> = {
  WIN: '#22C55E',
  LOSS: '#EF4444',
  BREAK_EVEN: '#F59E0B',
};

const DailyTradesList: React.FC<DailyTradesListProps> = ({ trades, date, onClose }) => {
  const dayPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">
            Trades for {date}
          </span>
          <span className={`ml-3 text-xs font-mono font-bold ${dayPnl >= 0 ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
            {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
          </span>
        </div>
        <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] cursor-pointer">
          <X size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--bg-border)] text-[var(--text-tertiary)]">
              <th className="text-left px-2 py-1.5 font-medium">Symbol</th>
              <th className="text-left px-2 py-1.5 font-medium">Direction</th>
              <th className="text-right px-2 py-1.5 font-medium">Entry</th>
              <th className="text-right px-2 py-1.5 font-medium">Exit</th>
              <th className="text-right px-2 py-1.5 font-medium">Qty</th>
              <th className="text-right px-2 py-1.5 font-medium">PnL</th>
              <th className="text-center px-2 py-1.5 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-hover)]">
                <td className="px-2 py-1.5 font-semibold text-[var(--text-primary)]">{trade.symbol}</td>
                <td className="px-2 py-1.5">
                  <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${
                    trade.direction === 'LONG' ? 'text-[var(--pass)] bg-[var(--pass-dim)]' : 'text-[var(--fail)] bg-[var(--fail-dim)]'
                  }`}>
                    {trade.direction}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-[var(--text-secondary)]">${trade.entry_price.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-[var(--text-secondary)]">
                  {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-[var(--text-secondary)]">{trade.quantity}</td>
                <td className={`px-2 py-1.5 text-right font-mono font-semibold ${
                  trade.pnl && trade.pnl > 0 ? 'text-[var(--pass)]' : trade.pnl && trade.pnl < 0 ? 'text-[var(--fail)]' : ''
                }`}>
                  {trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '-'}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {trade.outcome && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{
                      color: OUTCOME_COLORS[trade.outcome],
                      background: `${OUTCOME_COLORS[trade.outcome]}15`,
                    }}>
                      {trade.outcome}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyTradesList;
