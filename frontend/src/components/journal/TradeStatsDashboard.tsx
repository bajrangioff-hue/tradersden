import React, { useMemo } from 'react';
import type { TradeOut } from '../../types';

interface TradeStatsDashboardProps {
  trades: TradeOut[];
  dateFilter?: { from: string; to: string } | null;
}

const TradeStatsDashboard: React.FC<TradeStatsDashboardProps> = ({ trades, dateFilter }) => {
  const stats = useMemo(() => {
    let filtered = trades;
    if (dateFilter) {
      const from = new Date(dateFilter.from).getTime();
      const to = new Date(dateFilter.to).getTime();
      filtered = trades.filter((t) => {
        const tTime = new Date(t.entry_time).getTime();
        return tTime >= from && tTime <= to;
      });
    }

    const closed = filtered.filter((t) => t.pnl != null);
    const wins = closed.filter((t) => t.outcome === 'WIN');
    const losses = closed.filter((t) => t.outcome === 'LOSS');
    const breakevens = closed.filter((t) => t.outcome === 'BREAK_EVEN');

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
    const avgLoss = losses.length > 0 ? -(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl ?? 0)) : 0;

    return {
      total: closed.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      totalPnl,
      largestWin,
      largestLoss,
      winPct: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
      lossPct: closed.length > 0 ? (losses.length / closed.length) * 100 : 0,
      bePct: closed.length > 0 ? (breakevens.length / closed.length) * 100 : 0,
    };
  }, [trades, dateFilter]);

  const StatBlock: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color }) => (
    <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Total Trades" value={String(stats.total)} sub={`${stats.wins}W / ${stats.losses}L / ${stats.breakevens}BE`} />
        <StatBlock label="Winning Trades" value={String(stats.wins)} sub={`${stats.winPct.toFixed(0)}% rate`} color="var(--pass)" />
        <StatBlock label="Losing Trades" value={String(stats.losses)} sub={`${stats.lossPct.toFixed(0)}% rate`} color="var(--fail)" />
        <StatBlock label="Breakeven" value={String(stats.breakevens)} sub={`${stats.bePct.toFixed(0)}% rate`} color="var(--warn)" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Total P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? 'var(--pass)' : 'var(--fail)'} />
        <StatBlock label="Avg Win" value={`+$${stats.avgWin.toFixed(2)}`} color="var(--pass)" />
        <StatBlock label="Avg Loss" value={`-$${stats.avgLoss.toFixed(2)}`} color="var(--fail)" />
        <StatBlock label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color={stats.profitFactor >= 1.5 ? 'var(--pass)' : stats.profitFactor >= 1 ? 'var(--warn)' : 'var(--fail)'} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Largest Win" value={`+$${stats.largestWin.toFixed(2)}`} color="var(--pass)" />
        <StatBlock label="Largest Loss" value={`-$${Math.abs(stats.largestLoss).toFixed(2)}`} color="var(--fail)" />
        <StatBlock label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={stats.winRate >= 50 ? 'var(--pass)' : 'var(--fail)'} />
        <StatBlock label="Payoff Ratio" value={stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : stats.avgWin > 0 ? '∞' : '0'} color={stats.avgLoss > 0 && stats.avgWin / stats.avgLoss >= 2 ? 'var(--pass)' : stats.avgLoss > 0 && stats.avgWin / stats.avgLoss >= 1 ? 'var(--warn)' : 'var(--fail)'} />
      </div>
    </div>
  );
};

export default TradeStatsDashboard;
