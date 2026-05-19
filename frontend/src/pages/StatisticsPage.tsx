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
          <div className="h-8 w-48 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-4 w-64 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl" style={{ background: 'var(--bg-hover)' }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Statistics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Comprehensive trade analytics and performance metrics</p>
      </div>

      {error && (
        <div className="text-xs rounded-lg px-4 py-2" style={{ color: 'var(--fail)', background: 'var(--fail-dim)' }}>{error}</div>
      )}

      <TradeStatsDashboard trades={trades} dateFilter={dateFilter} />

      {/* By Symbol */}
      {symbolStats.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Performance by Symbol</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--bg-border)' }}>
                  <th className="text-left px-3 py-2 font-medium text-[var(--text-tertiary)]">Symbol</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--text-tertiary)]">Trades</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--text-tertiary)]">Wins</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--text-tertiary)]">Losses</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--text-tertiary)]">Win Rate</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--text-tertiary)]">Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {symbolStats.map((s) => (
                  <tr key={s.symbol} className="border-b" style={{ borderColor: 'var(--bg-border)' }}>
                    <td className="px-3 py-2 font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{s.symbol}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{s.total}</td>
                    <td className="px-3 py-2 text-right font-mono text-[var(--pass)]">{s.wins}</td>
                    <td className="px-3 py-2 text-right font-mono text-[var(--fail)]">{s.losses}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: s.winRate >= 50 ? 'var(--pass)' : 'var(--fail)' }}>{s.winRate.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: s.pnl >= 0 ? 'var(--pass)' : 'var(--fail)' }}>{s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Session */}
      {sessionStats.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Performance by Session</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sessionStats.map((s) => (
              <div key={s.session} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>{s.session}</div>
                <div className="text-lg font-bold font-mono" style={{ color: s.pnl >= 0 ? 'var(--pass)' : 'var(--fail)' }}>{s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.wins}/{s.total} ({s.winRate.toFixed(0)}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trades.length === 0 && !loading && (
        <div className="text-center py-16">
          <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No trades yet</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Log trades in the journal to see statistics</div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
