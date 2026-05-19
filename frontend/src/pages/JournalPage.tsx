import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, ChevronDown, ChevronRight, Filter, Calendar, ExternalLink } from 'lucide-react';
import { listTrades, deleteTrade } from '../lib/api';
import TradeStatsCards from '../components/journal/TradeStatsCards';
import TradeForm from '../components/journal/TradeForm';
import TradeDetailCard from '../components/journal/TradeDetailCard';
import type { TradeOut } from '../types';

const OUTCOME_COLORS: Record<string, string> = {
  WIN: '#00FF88',
  LOSS: '#FF3B5C',
  BREAK_EVEN: '#F59E0B',
};

const JournalPage: React.FC = () => {
  const [trades, setTrades] = useState<TradeOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<TradeOut | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeOut | null>(null);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState('');

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (symbolFilter) params.symbol = symbolFilter;
      if (outcomeFilter) params.outcome = outcomeFilter;
      const result = await listTrades(params);
      setTrades(result.trades);
      setTotal(result.total);

      const tags = new Set<string>();
      result.trades.forEach((t) => t.setup_tags?.forEach((tag) => tags.add(tag)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, symbolFilter, outcomeFilter]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTrade(id);
      setSelectedTrade(null);
      fetchTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleEdit = (trade: TradeOut) => {
    setEditTrade(trade);
    setShowForm(true);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditTrade(null);
    fetchTrades();
  };

  const clearFilters = () => {
    setSymbolFilter('');
    setOutcomeFilter('');
    setTagFilter('');
    setDateFilter('');
    setPage(1);
  };

  const hasFilters = symbolFilter || outcomeFilter || tagFilter || dateFilter;

  const filteredTrades = useMemo(() => {
    let result = trades;
    if (tagFilter) {
      result = result.filter((t) => t.setup_tags?.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase())));
    }
    if (dateFilter) {
      const d = dateFilter;
      result = result.filter((t) => t.entry_time.startsWith(d));
    }
    return result;
  }, [trades, tagFilter, dateFilter]);

  const recentTrades = useMemo(() => {
    return filteredTrades.slice(0, 5).map((t) => ({
      symbol: t.symbol,
      direction: t.direction,
      pnl: t.pnl ?? 0,
      entry_time: t.entry_time,
    }));
  }, [filteredTrades]);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {showForm && <TradeForm onSaved={handleFormSaved} onCancel={() => { setShowForm(false); setEditTrade(null); }} editTrade={editTrade} />}
      {selectedTrade && (
        <TradeDetailCard
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Journal</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track, analyze, and learn from every trade</p>
      </div>

      {error && (
        <div className="text-xs rounded-lg px-4 py-2" style={{ color: 'var(--fail)', background: 'var(--fail-dim)' }}>{error}</div>
      )}

      {/* Stats Cards */}
      <TradeStatsCards trades={filteredTrades} />

      {/* Filters + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              value={symbolFilter}
              onChange={(e) => { setSymbolFilter(e.target.value.toUpperCase()); setPage(1); }}
              placeholder="Symbol..."
              className="w-20 pl-7 pr-2 py-1.5 rounded-lg text-[10px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
            />
          </div>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
            className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-[var(--text-primary)] outline-none transition-all"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent', color: 'var(--text-primary)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <option value="" style={{ background: 'var(--bg-tertiary)' }}>All Outcomes</option>
            <option value="WIN" style={{ background: 'var(--bg-tertiary)' }}>Wins</option>
            <option value="LOSS" style={{ background: 'var(--bg-tertiary)' }}>Losses</option>
            <option value="BREAK_EVEN" style={{ background: 'var(--bg-tertiary)' }}>Break Even</option>
          </select>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
              className="px-2 py-1.5 rounded-lg text-[10px] font-medium outline-none transition-all"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <option value="" style={{ background: 'var(--bg-tertiary)' }}>All Tags</option>
              {allTags.map((tag) => <option key={tag} value={tag} style={{ background: 'var(--bg-tertiary)' }}>{tag}</option>)}
            </select>
          )}
          {hasFilters && (
            <button onClick={clearFilters} className="text-[9px] font-semibold px-2 py-1.5 rounded-lg cursor-pointer border-none transition-colors" style={{ color: 'var(--text-tertiary)', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--pass)' }}>
            {total > 0 && `This Month: +$${filteredTrades.filter((t) => t.pnl && t.pnl > 0).reduce((s, t) => s + (t.pnl ?? 0), 0).toFixed(2)}`}
          </span>
          <button
            onClick={() => { setEditTrade(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider cursor-pointer border-none transition-all"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            <Plus size={14} />
            New Trade
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--bg-border)' }}>
              <th className="w-6 px-2 py-3" />
              <th className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none" style={{ color: 'var(--text-tertiary)' }} onClick={() => setPage(1)}>Date</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Symbol</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Dir</th>
              <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Entry</th>
              <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Exit</th>
              <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Size</th>
              <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>P&L</th>
              <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider hide-mobile" style={{ color: 'var(--text-tertiary)' }}>ROI%</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((trade) => {
              const pnl = trade.pnl ?? 0;
              const roi = trade.exit_price && trade.entry_price ? ((trade.exit_price - trade.entry_price) / trade.entry_price * 100) : null;
              const isProfit = pnl >= 0;
              return (
                <tr
                  key={trade.id}
                  className="border-b cursor-pointer transition-colors group"
                  style={{ borderColor: 'rgba(42,42,46,0.6)' }}
                  onClick={() => setSelectedTrade(trade)}
                >
                  <td className="px-2 py-3 text-[var(--text-tertiary)]" onClick={(e) => e.stopPropagation()}>
                    <ChevronRight size={12} />
                  </td>
                  <td className="px-3 py-3 text-[10px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(trade.entry_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-3 py-3 text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{trade.symbol}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.direction === 'LONG' ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`} style={{ background: trade.direction === 'LONG' ? 'var(--pass-dim)' : 'var(--fail-dim)' }}>
                      {trade.direction === 'LONG' ? 'L' : 'S'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-[11px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>${trade.entry_price.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-[11px] font-mono font-medium" style={{ color: trade.exit_price ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                    {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-[11px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{trade.quantity}</td>
                  <td className={`px-3 py-3 text-right text-xs font-bold font-mono ${isProfit ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </td>
                  <td className={`px-3 py-3 text-right text-[11px] font-bold font-mono hide-mobile ${roi && roi >= 0 ? 'text-[var(--pass)]' : roi && roi < 0 ? 'text-[var(--fail)]' : ''}`} style={{ color: !roi ? 'var(--text-tertiary)' : undefined }}>
                    {roi ? `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {trade.outcome ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                        color: OUTCOME_COLORS[trade.outcome],
                        background: `${OUTCOME_COLORS[trade.outcome]}15`,
                      }}>
                        {trade.outcome === 'BREAK_EVEN' ? 'BE' : trade.outcome}
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)' }}>OPEN</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredTrades.length === 0 && !loading && (
              <tr><td colSpan={10} className="px-3 py-12 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>No trades yet — click "New Trade" to get started</td></tr>
            )}
            {loading && (
              <tr><td colSpan={10} className="px-3 py-12 text-center text-xs shimmer" style={{ color: 'var(--text-tertiary)' }}>Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-7 h-7 text-[10px] font-bold rounded-lg cursor-pointer border-none transition-colors ${
                page === i + 1 ? 'text-black' : 'text-[var(--text-tertiary)]'
              }`}
              style={{ background: page === i + 1 ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
