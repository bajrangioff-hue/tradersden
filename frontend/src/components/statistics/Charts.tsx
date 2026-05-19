import React, { useMemo } from 'react';
import type { TradeOut } from '../../types';

interface ChartsProps {
  trades: TradeOut[];
}

const MiniBar: React.FC<{ value: number; max: number; color: string; height?: number }> = ({ value, max, color, height = 40 }) => (
  <div
    className="w-full rounded-t-sm transition-all duration-300"
    style={{
      height: `${Math.max((value / max) * height, 2)}px`,
      background: color,
      opacity: 0.8,
    }}
  />
);

const Charts: React.FC<ChartsProps> = ({ trades }) => {
  const pnlByDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    trades.filter((t) => t.pnl != null).forEach((t) => {
      const day = new Date(t.entry_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] || 0) + (t.pnl ?? 0);
    });
    return Object.entries(byDay).slice(-30);
  }, [trades]);

  const maxAbsPnl = useMemo(() => Math.max(...pnlByDay.map(([, v]) => Math.abs(v)), 1), [pnlByDay]);

  if (pnlByDay.length === 0) return null;

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>P&L Over Time</h2>
      <div className="flex items-end gap-1 h-20">
        {pnlByDay.map(([day, pnl], i) => {
          const color = pnl >= 0 ? 'var(--pass)' : 'var(--fail)';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <MiniBar value={Math.abs(pnl)} max={maxAbsPnl} color={color} />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] text-[10px] font-mono px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ border: 'var(--border-subtle)' }}>
                {day}: {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
        <span>{pnlByDay[0]?.[0] ?? ''}</span>
        <span>{pnlByDay[pnlByDay.length - 1]?.[0] ?? ''}</span>
      </div>
    </div>
  );
};

export default Charts;
