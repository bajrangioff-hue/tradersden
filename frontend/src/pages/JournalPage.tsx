import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import { listTrades, deleteTrade } from '../lib/api';
import TradeStatsCards from '../components/journal/TradeStatsCards';
import TradeForm from '../components/journal/TradeForm';
import TradeDetailCard from '../components/journal/TradeDetailCard';
import type { TradeOut } from '../types';

interface JournalPageProps {
  defaultOpenForm?: boolean
}

const DATE_OPTIONS = [
  { value: '', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const JournalPage: React.FC<JournalPageProps> = ({ defaultOpenForm = false }) => {
  const [trades, setTrades] = useState<TradeOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(defaultOpenForm);
  const [editTrade, setEditTrade] = useState<TradeOut | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeOut | null>(null);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

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
    setDateFilter('');
    setSessionFilter('');
    setPage(1);
  };

  const hasFilters = symbolFilter || outcomeFilter || dateFilter || sessionFilter;

  const filteredTrades = useMemo(() => {
    let result = trades;
    if (sessionFilter) {
      result = result.filter((t) => t.session === sessionFilter);
    }
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((t) => t.entry_time.startsWith(today));
    } else if (dateFilter === 'week') {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const startStr = start.toISOString().split('T')[0];
      result = result.filter((t) => t.entry_time >= startStr);
    } else if (dateFilter === 'month') {
      const now = new Date();
      const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      result = result.filter((t) => t.entry_time.startsWith(startStr));
    }
    return result;
  }, [trades, sessionFilter, dateFilter]);

  const isEmpty = filteredTrades.length === 0 && !loading && !error;

  return (
    <div style={{ background: '#F8F9FC', padding: 24, minHeight: '100%' }}>
      {showForm && <TradeForm onSaved={handleFormSaved} onCancel={() => { setShowForm(false); setEditTrade(null); }} editTrade={editTrade} />}
      {selectedTrade && (
        <TradeDetailCard
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A202C]">Trade Journal</h1>
          <p className="text-[13px] text-[#9CA3AF]" style={{ marginTop: 4 }}>Track, analyze, and refine every trade</p>
        </div>
        <button
          onClick={() => { setEditTrade(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-semibold cursor-pointer border-none text-white transition-[background] duration-200"
          style={{ background: '#6C5CE7' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#5B4BD4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#6C5CE7'; }}
        >
          <Plus size={16} />
          New Trade
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <TradeStatsCards trades={filteredTrades} />
      </div>

      <div className="flex items-center gap-3" style={{ marginTop: 24 }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            value={symbolFilter}
            onChange={(e) => { setSymbolFilter(e.target.value.toUpperCase()); setPage(1); }}
            placeholder="Filter by symbol..."
            style={{
              width: 220, height: 36, border: '1px solid #EEF0F3', borderRadius: 8,
              padding: '0 12px 0 32px', fontSize: 13, color: '#374151', background: '#FFFFFF',
              outline: 'none', transition: 'border-color 150ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
          />
        </div>

        <select
          value={outcomeFilter}
          onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
          style={{
            height: 36, border: '1px solid #EEF0F3', borderRadius: 8,
            padding: '0 12px', fontSize: 13, color: '#374151', background: '#FFFFFF',
            outline: 'none', transition: 'border-color 150ms',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
        >
          <option value="">All Outcomes</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Loss</option>
          <option value="BREAK_EVEN">Breakeven</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          style={{
            height: 36, border: '1px solid #EEF0F3', borderRadius: 8,
            padding: '0 12px', fontSize: 13, color: '#374151', background: '#FFFFFF',
            outline: 'none', transition: 'border-color 150ms',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
        >
          {DATE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        <select
          value={sessionFilter}
          onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
          style={{
            height: 36, border: '1px solid #EEF0F3', borderRadius: 8,
            padding: '0 12px', fontSize: 13, color: '#374151', background: '#FFFFFF',
            outline: 'none', transition: 'border-color 150ms',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
        >
          <option value="">All Sessions</option>
          <option value="London">London</option>
          <option value="NY AM">NY AM</option>
          <option value="NY PM">NY PM</option>
          <option value="Asia">Asia</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="text-[11px] font-semibold px-3 cursor-pointer border-none text-[#9CA3AF] hover:text-[#6C5CE7] transition-colors duration-150" style={{ height: 36, background: 'transparent', borderRadius: 8 }}>
            Clear
          </button>
        )}

        <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 'auto' }}>
          {total} trade{total !== 1 ? 's' : ''}
        </span>
      </div>

      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center bg-white rounded-xl"
          style={{
            marginTop: 16, height: 280,
            border: '1px solid #EEF0F3',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <BookOpen size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No trades yet</span>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Click New Trade to log your first trade</p>
          <button
            onClick={() => { setEditTrade(null); setShowForm(true); }}
            className="flex items-center gap-2 font-semibold cursor-pointer border-none text-white transition-[background] duration-200"
            style={{
              marginTop: 20, padding: '10px 24px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, background: '#6C5CE7',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#5B4BD4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#6C5CE7'; }}
          >
            <Plus size={16} />
            New Trade
          </button>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{
            marginTop: 16,
            border: '1px solid #EEF0F3',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {error && (
            <div className="px-5 py-3 text-[13px] text-[#E17055]" style={{ background: 'rgba(225,112,85,0.10)' }}>{error}</div>
          )}
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8F9FC', borderBottom: '1px solid #EEF0F3' }}>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-5 py-3" style={{ width: 120 }}>Date</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 100 }}>Symbol</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 80 }}>Dir</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 100 }}>Entry</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 100 }}>Exit</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 80 }}>Size</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 100 }}>P&amp;L</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 60 }}>R</th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-4 py-3" style={{ width: 120 }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-[13px] text-[#9CA3AF]">Loading trades...</td></tr>
              ) : (
                filteredTrades.map((trade) => {
                  const pnl = trade.pnl ?? 0;
                  const isProfit = pnl >= 0;
                  const risk = trade.stop_loss ? Math.abs(trade.entry_price - trade.stop_loss) * trade.quantity : null;
                  const reward = trade.exit_price ? Math.abs(trade.exit_price - trade.entry_price) * trade.quantity : null;
                  const rr = risk && reward && risk > 0 ? (reward / risk) : null;
                  const displayR = rr ? `R${rr.toFixed(2)}` : null;
                  return (
                    <tr
                      key={trade.id}
                      className="cursor-pointer transition-colors duration-150"
                      style={{ height: 52, borderBottom: '1px solid #F9FAFB', fontSize: 13, color: '#374151' }}
                      onClick={() => setSelectedTrade(trade)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-5 py-0">{new Date(trade.entry_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-0 font-semibold text-[#1A202C]">{trade.symbol}</td>
                      <td className="px-4 py-0">
                        <span className="text-[10px] font-semibold px-[10px] py-[3px]" style={{
                          borderRadius: 20,
                          color: trade.direction === 'LONG' ? '#16A34A' : '#DC2626',
                          background: trade.direction === 'LONG' ? '#DCFCE7' : '#FEE2E2',
                        }}>
                          {trade.direction === 'LONG' ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="px-4 py-0 text-right">${trade.entry_price.toFixed(2)}</td>
                      <td className="px-4 py-0 text-right" style={{ color: trade.exit_price ? '#374151' : '#9CA3AF' }}>
                        {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '\u2014'}
                      </td>
                      <td className="px-4 py-0 text-right">{trade.quantity}</td>
                      <td className={`px-4 py-0 text-right font-semibold ${isProfit ? 'text-[#00B894]' : 'text-[#E17055]'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-0 text-right font-semibold" style={{ color: displayR ? (rr && rr >= 2 ? '#00B894' : rr && rr >= 1 ? '#F59E0B' : '#E17055') : '#9CA3AF' }}>
                        {displayR || '\u2014'}
                      </td>
                      <td className="px-4 py-0 text-center">
                        {trade.outcome ? (
                          <span className="text-[10px] font-semibold px-[10px] py-[3px]" style={{
                            borderRadius: 20,
                            color: trade.outcome === 'WIN' ? '#16A34A' : trade.outcome === 'LOSS' ? '#DC2626' : '#6B7280',
                            background: trade.outcome === 'WIN' ? '#DCFCE7' : trade.outcome === 'LOSS' ? '#FEE2E2' : '#F3F4F6',
                          }}>
                            {trade.outcome === 'BREAK_EVEN' ? 'BE' : trade.outcome}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-[10px] py-[3px] text-[#9CA3AF]" style={{ borderRadius: 20, background: '#F8F9FC' }}>Open</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JournalPage;
