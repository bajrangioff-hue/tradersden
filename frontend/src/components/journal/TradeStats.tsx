import React, { useMemo } from 'react';
import type { TradeOut } from '../../types';

interface TradeStatsProps {
  trades: TradeOut[];
  total: number;
}

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div
    className="flex flex-col items-center justify-center p-3 rounded-xl min-w-[100px]"
    style={{ background: 'var(--bg-elevated)', border: 'var(--border-subtle)' }}
  >
    <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{label}</span>
    <span className="text-lg font-bold font-mono" style={{ color: color || 'var(--text-primary)' }}>{value}</span>
  </div>
);

const TradeStats: React.FC<TradeStatsProps> = ({ trades, total }) => {
  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.outcome === 'WIN');
    const losses = trades.filter((t) => t.outcome === 'LOSS');
    const breakevens = trades.filter((t) => t.outcome === 'BREAK_EVEN');
    const closed = trades.filter((t) => t.pnl != null);

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

    const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

    const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
    const payoffRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl ?? 0)) : 0;

    const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const expectancy = closed.length > 0 ? netPnl / closed.length : 0;

    let bestStreak = 0;
    let worstStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    for (const t of trades) {
      if (t.outcome === 'WIN') {
        currentWinStreak++;
        currentLossStreak = 0;
        bestStreak = Math.max(bestStreak, currentWinStreak);
      } else if (t.outcome === 'LOSS') {
        currentLossStreak++;
        currentWinStreak = 0;
        worstStreak = Math.max(worstStreak, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    }

    return {
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      payoffRatio,
      largestWin,
      largestLoss,
      netPnl,
      expectancy,
      bestStreak,
      worstStreak,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
    };
  }, [trades]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Performance Stats</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={stats.winRate >= 50 ? 'var(--pass)' : 'var(--fail)'} />
        <StatCard label="Net P&L" value={`${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(2)}`} color={stats.netPnl >= 0 ? 'var(--pass)' : 'var(--fail)'} />
        <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color={stats.profitFactor >= 1.5 ? 'var(--pass)' : stats.profitFactor >= 1 ? 'var(--warn)' : 'var(--fail)'} />
        <StatCard label="Payoff Ratio" value={stats.payoffRatio.toFixed(2)} color={stats.payoffRatio >= 2 ? 'var(--pass)' : stats.payoffRatio >= 1 ? 'var(--warn)' : 'var(--fail)'} />
        <StatCard label="Avg Win" value={`+$${stats.avgWin.toFixed(2)}`} color="var(--pass)" />
        <StatCard label="Avg Loss" value={`-$${Math.abs(stats.avgLoss).toFixed(2)}`} color="var(--fail)" />
        <StatCard label="Best Streak" value={`${stats.bestStreak}`} color="var(--pass)" />
        <StatCard label="Worst Streak" value={`${stats.worstStreak}`} color="var(--fail)" />
      </div>
      <div className="flex gap-4 text-[11px] text-[var(--text-tertiary)]">
        <span>Total: <span className="font-semibold text-[var(--text-primary)]">{stats.wins + stats.losses + stats.breakevens}</span></span>
        <span>Wins: <span className="font-semibold text-[var(--pass)]">{stats.wins}</span></span>
        <span>Losses: <span className="font-semibold text-[var(--fail)]">{stats.losses}</span></span>
        {stats.breakevens > 0 && <span>BE: <span className="font-semibold text-[var(--warn)]">{stats.breakevens}</span></span>}
        <span>Avg: <span className="font-semibold text-[var(--text-secondary)]">${stats.expectancy.toFixed(2)}/trade</span></span>
      </div>
    </div>
  );
};

export default TradeStats;
