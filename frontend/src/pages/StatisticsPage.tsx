import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Download } from 'lucide-react';
import { listTrades } from '../lib/api';
import TradeStatsDashboard from '../components/journal/TradeStatsDashboard';
import type { TradeOut } from '../types';

const StatisticsPage: React.FC = () => {
  const [trades, setTrades] = useState<TradeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);

  const fetchAllTrades = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listTrades({ page_size: 500 });
      setTrades(result.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTrades();
  }, [fetchAllTrades]);

  const symbolStats = useMemo(() => {
    const bySymbol: Record<string, { total: number; wins: number; losses: number; pnl: number }> = {};
    trades.filter((t) => t.pnl != null).forEach((t) => {
      if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { total: 0, wins: 0, losses: 0, pnl: 0 };
      bySymbol[t.symbol].total++;
      if (t.outcome === 'WIN') bySymbol[t.symbol].wins++;
      if (t.outcome === 'LOSS') bySymbol[t.symbol].losses++;
      bySymbol[t.symbol].pnl += t.pnl ?? 0;
    });
    return Object.entries(bySymbol)
      .map(([symbol, s]) => ({ symbol, ...s, winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0 }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 10);
  }, [trades]);

  const sessionStats = useMemo(() => {
    const bySession: Record<string, { total: number; wins: number; pnl: number }> = {};
    trades.filter((t) => t.pnl != null && t.session).forEach((t) => {
      const s = t.session ?? 'Unknown';
      if (!bySession[s]) bySession[s] = { total: 0, wins: 0, pnl: 0 };
      bySession[s].total++;
      if (t.outcome === 'WIN') bySession[s].wins++;
      bySession[s].pnl += t.pnl ?? 0;
    });
    return Object.entries(bySession)
      .map(([session, s]) => ({ session, ...s, winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [trades]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[#F3F4F6]" />
          <div className="h-4 w-64 rounded-lg bg-[#F3F4F6]" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#F3F4F6]" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a202c' }}>Statistics</h1>
        <p className="text-sm mt-1 text-[#6B7280]">Comprehensive trade analytics and performance metrics</p>
      </div>

      {error && (
        <div className="text-xs rounded-lg px-4 py-2 bg-[#FEF2F2] text-[#E17055]">{error}</div>
      )}

      <TradeStatsDashboard trades={trades} dateFilter={dateFilter} />

      {/* By Symbol */}
      {symbolStats.length > 0 && (
        <div className="rounded-xl p-5 bg-white border border-[#EEF0F3]">
          <h2 className="text-sm font-semibold mb-4 text-[#1A202C]">Performance by Symbol</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EEF0F3]">
                  <th className="text-left px-3 py-2 font-medium text-[#9CA3AF]">Symbol</th>
                  <th className="text-right px-3 py-2 font-medium text-[#9CA3AF]">Trades</th>
                  <th className="text-right px-3 py-2 font-medium text-[#9CA3AF]">Wins</th>
                  <th className="text-right px-3 py-2 font-medium text-[#9CA3AF]">Losses</th>
                  <th className="text-right px-3 py-2 font-medium text-[#9CA3AF]">Win Rate</th>
                  <th className="text-right px-3 py-2 font-medium text-[#9CA3AF]">Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {symbolStats.map((s) => (
                  <tr key={s.symbol} className="border-b border-[#EEF0F3]">
                    <td className="px-3 py-2 font-semibold font-mono text-[#1A202C]">{s.symbol}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#6B7280]">{s.total}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#00B894]">{s.wins}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#E17055]">{s.losses}</td>
                    <td className={`px-3 py-2 text-right font-mono ${s.winRate >= 50 ? 'text-[#00B894]' : 'text-[#E17055]'}`}>{s.winRate.toFixed(0)}%</td>
                    <td className={`px-3 py-2 text-right font-mono font-semibold ${s.pnl >= 0 ? 'text-[#00B894]' : 'text-[#E17055]'}`}>{s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Session */}
      {sessionStats.length > 0 && (
        <div className="rounded-xl p-5 bg-white border border-[#EEF0F3]">
          <h2 className="text-sm font-semibold mb-4 text-[#1A202C]">Performance by Session</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sessionStats.map((s) => (
              <div key={s.session} className="rounded-xl p-4 text-center bg-[#F8F9FC] border border-[#EEF0F3]">
                <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-[#9CA3AF]">{s.session}</div>
                <div className={`text-lg font-bold font-mono ${s.pnl >= 0 ? 'text-[#00B894]' : 'text-[#E17055]'}`}>{s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}</div>
                <div className="text-xs mt-1 text-[#9CA3AF]">{s.wins}/{s.total} ({s.winRate.toFixed(0)}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trades.length === 0 && !loading && (
        <div className="text-center py-16">
          <Calendar size={32} className="mx-auto mb-3 text-[#9CA3AF]" />
          <div className="text-sm font-medium text-[#6B7280]">No trades yet</div>
          <div className="text-xs mt-1 text-[#9CA3AF]">Log trades in the journal to see statistics</div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
