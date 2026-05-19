import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Target, DollarSign, Trophy, AlertTriangle } from 'lucide-react';
import type { TradeOut } from '../../types';

interface TradeStatsCardsProps {
  trades: TradeOut[];
}

interface StatCardData {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<{ data: StatCardData }> = ({ data }) => (
  <div className="rounded-xl p-4 flex flex-col" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{data.label}</span>
      <span style={{ color: data.color }}>{data.icon}</span>
    </div>
    <span className="text-xl font-bold font-mono" style={{ color: data.color }}>{data.value}</span>
    {data.trend && (
      <span className={`text-[10px] font-semibold mt-1 ${data.trendUp ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
        {data.trendUp ? '↑' : '↓'} {data.trend}
      </span>
    )}
  </div>
);

const TradeStatsCards: React.FC<TradeStatsCardsProps> = ({ trades }) => {
  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.pnl != null);
    const wins = closed.filter((t) => t.outcome === 'WIN');
    const losses = closed.filter((t) => t.outcome === 'LOSS');
    const breakevens = closed.filter((t) => t.outcome === 'BREAK_EVEN');

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgRoi = closed.length > 0 ? closed.reduce((s, t) => {
      if (t.entry_price && t.exit_price) {
        return s + Math.abs((t.exit_price - t.entry_price) / t.entry_price) * 100;
      }
      return s;
    }, 0) / closed.length : 0;
    const bestTrade = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
    const worstTrade = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl ?? 0)) : 0;

    let consecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    for (const t of trades) {
      if (t.outcome === 'WIN') {
        consecutiveWins++;
        consecutiveLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
      } else if (t.outcome === 'LOSS') {
        consecutiveLosses++;
        consecutiveWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
      } else {
        consecutiveWins = 0;
        consecutiveLosses = 0;
      }
    }

    return {
      total: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      profitFactor,
      totalPnl,
      avgRoi,
      bestTrade,
      worstTrade,
      maxConsecutiveWins,
      maxConsecutiveLosses,
    };
  }, [trades]);

  const cards: StatCardData[] = [
    {
      label: 'Total Trades',
      value: String(stats.total),
      icon: <BarChart3 size={16} />,
      color: 'var(--text-primary)',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(0)}%`,
      icon: <Target size={16} />,
      color: stats.winRate >= 50 ? 'var(--pass)' : 'var(--fail)',
      trend: `${stats.wins}W / ${stats.losses}L`,
      trendUp: stats.winRate >= 50,
    },
    {
      label: 'Profit Factor',
      value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2),
      icon: <TrendingUp size={16} />,
      color: stats.profitFactor >= 1.5 ? 'var(--pass)' : stats.profitFactor >= 1 ? 'var(--warn)' : 'var(--fail)',
    },
    {
      label: 'Avg ROI',
      value: `${stats.avgRoi.toFixed(1)}%`,
      icon: <DollarSign size={16} />,
      color: stats.avgRoi >= 0 ? 'var(--pass)' : 'var(--fail)',
    },
    {
      label: 'Best Trade',
      value: `+$${stats.bestTrade.toFixed(2)}`,
      icon: <Trophy size={16} />,
      color: 'var(--pass)',
    },
    {
      label: 'Worst Trade',
      value: `-$${Math.abs(stats.worstTrade).toFixed(2)}`,
      icon: <AlertTriangle size={16} />,
      color: 'var(--fail)',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} data={card} />
      ))}
    </div>
  );
};

export default TradeStatsCards;
