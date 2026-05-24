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
  iconColor: string;
  valueColor: string;
  footer?: string;
}

const StatCard: React.FC<{ data: StatCardData }> = ({ data }) => (
  <div
    className="flex flex-col justify-between bg-white rounded-xl"
    style={{
      border: '1px solid #EEF0F3',
      borderRadius: 12,
      padding: 20,
      minHeight: 90,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{data.label}</span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${data.iconColor}1A` }}>
        <span style={{ color: data.iconColor }}>{data.icon}</span>
      </div>
    </div>
    <span className="text-[22px] font-bold" style={{ color: data.valueColor }}>{data.value}</span>
    {data.footer && <span className="text-[11px] text-[#9CA3AF]">{data.footer}</span>}
  </div>
);

const TradeStatsCards: React.FC<TradeStatsCardsProps> = ({ trades }) => {
  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.pnl != null);
    const wins = closed.filter((t) => t.outcome === 'WIN');
    const losses = closed.filter((t) => t.outcome === 'LOSS');
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const bestTrade = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
    const worstTrade = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl ?? 0)) : 0;
    return { total: closed.length, wins: wins.length, losses: losses.length, winRate, profitFactor, totalPnl, bestTrade, worstTrade };
  }, [trades]);

  const cards: StatCardData[] = [
    {
      label: 'Total Trades',
      value: String(stats.total),
      icon: <BarChart3 size={18} />,
      iconColor: '#6C5CE7',
      valueColor: '#1A202C',
      footer: 'this month',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(0)}%`,
      icon: <Target size={18} />,
      iconColor: '#6C5CE7',
      valueColor: '#6C5CE7',
      footer: stats.total > 0 ? `${stats.wins}W / ${stats.losses}L` : '0W / 0L',
    },
    {
      label: 'Profit Factor',
      value: stats.profitFactor === Infinity ? '\u221E' : stats.profitFactor.toFixed(2),
      icon: <TrendingUp size={18} />,
      iconColor: '#6C5CE7',
      valueColor: '#6C5CE7',
      footer: 'this month',
    },
    {
      label: 'Net P&L',
      value: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`,
      icon: <DollarSign size={18} />,
      iconColor: stats.totalPnl >= 0 ? '#00B894' : '#E17055',
      valueColor: stats.totalPnl >= 0 ? '#00B894' : '#E17055',
      footer: 'this month',
    },
    {
      label: 'Best Trade',
      value: `+$${stats.bestTrade.toFixed(2)}`,
      icon: <Trophy size={18} />,
      iconColor: '#00B894',
      valueColor: '#00B894',
      footer: 'this month',
    },
    {
      label: 'Worst Trade',
      value: `-$${Math.abs(stats.worstTrade).toFixed(2)}`,
      icon: <AlertTriangle size={18} />,
      iconColor: '#E17055',
      valueColor: '#E17055',
      footer: 'this month',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-[14px]">
      {cards.map((card) => (
        <StatCard key={card.label} data={card} />
      ))}
    </div>
  );
};

export default TradeStatsCards;
