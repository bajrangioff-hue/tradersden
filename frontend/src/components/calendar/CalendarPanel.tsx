import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useFilterState } from '../../hooks/useFilterState';
import LoadingStates from '../common/LoadingStates';
import { formatTime } from '../../utils/formatters';
import type { CalendarEvent } from '../../types';

interface CalendarPanelProps {
  data: CalendarEvent[] | null;
  loading: boolean;
  error: string | null;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ data, loading, error }) => {
  if (loading) return <LoadingStates type="default" />;
  if (error) {
    return (
      <div className="card-surface p-5" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--fail)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  const raw = data || [];
  const { filters, allCurrencies, setImpact, toggleCurrency, setSort, clear, hasFilters, filtered } = useFilterState(raw);

  const filterParts: string[] = [];
  if (filters.impact !== 'all') filterParts.push(`${filters.impact.toUpperCase()} impact`);
  if (filters.currencies.length === 1) filterParts.push(`${filters.currencies[0]} only`);
  else if (filters.currencies.length > 1) filterParts.push(filters.currencies.join(', '));
  const filterLabel = filterParts.length ? ` (${filterParts.join(', ')})` : '';

  if (!raw.length) {
    return (
      <div className="rounded-xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <div className="text-sm text-[var(--text-tertiary)]">No calendar events available.</div>
      </div>
    );
  }

  return (
    <div className="card-surface">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">
            Economic Calendar
          </span>
          <span className="text-[10px] mono text-[var(--text-tertiary)] flex items-center gap-1">
            <RefreshCw size={11} /> Auto-refresh 30s
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-4">
          {/* Row 1: Impact + Sort + Clear */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'high', 'medium', 'low'] as const).map((level) => {
              const active = filters.impact === level;
              const dotColor = level === 'high' ? 'var(--fail)' : level === 'medium' ? 'var(--warning)' : level === 'low' ? 'var(--text-tertiary)' : 'transparent';
              const cls = active
                ? level === 'all'
                  ? 'text-[var(--text-primary)] bg-[var(--bg-active)]'
                  : `text-[var(--text-primary)] bg-[var(--bg-active)]`
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-transparent';
              return (
                <button
                  key={level}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wider cursor-pointer transition-all font-sans border-none flex items-center gap-1.5 ${cls}`}
                  onClick={() => setImpact(level)}
                >
                  {level !== 'all' && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />}
                  {level === 'all' ? 'ALL' : level.toUpperCase()}
                </button>
              );
            })}

            <select
              value={filters.sort}
              onChange={(e) => setSort(e.target.value as typeof filters.sort)}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--bg-border)] outline-none transition-colors hover:border-[var(--text-tertiary)] focus:border-[var(--accent)] font-sans"
            >
              <option value="time_asc">TIME ASC</option>
              <option value="time_desc">TIME DESC</option>
              <option value="impact_high">IMPACT (high first)</option>
            </select>

            {hasFilters && (
              <button
                className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors bg-[var(--fail-dim)] text-[var(--fail)] border border-[var(--fail-dim)] hover:brightness-110 font-sans"
                onClick={clear}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Row 2: Currency chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {allCurrencies.map((c) => {
              const active = filters.currencies.includes(c);
              return (
                <button
                  key={c}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold mono cursor-pointer transition-all border ${
                    active
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent-border)]'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--bg-border)] hover:text-[var(--text-primary)]'
                  }`}
                  onClick={() => toggleCurrency(c)}
                >
                  {active ? '\u2713 ' : ''}{c}
                </button>
              );
            })}
          </div>

          {/* Row 3: Filter count */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] mono text-[var(--text-tertiary)]">
              Showing {filtered.length} events{filterLabel}
            </span>
            {filtered.length === 0 && (
              <span className="text-[11px] mono text-[var(--fail)]">&middot; No events match current filters</span>
            )}
          </div>
        </div>

        {/* Table */}
        {filtered.length > 0 && (
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="sticky top-0 z-10" style={{ background: 'var(--bg-elevated)' }}>
                  {['Time', 'Currency', 'Impact', 'Event', 'Forecast', 'Previous', 'Actual'].map((h) => (
                    <th
                      key={h}
                      className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] text-left"
                      style={{ borderBottom: 'var(--border-subtle)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={i} className="transition-colors hover:bg-[var(--bg-hover)]">
                    <td className="px-2.5 py-2 text-xs mono text-[var(--text-secondary)]" style={{ borderBottom: 'var(--border-subtle)' }}>
                      {formatTime(e.datetime)}
                    </td>
                    <td className="px-2.5 py-2 text-xs font-semibold mono text-[var(--accent)]" style={{ borderBottom: 'var(--border-subtle)' }}>
                      {e.currency || e.country || ''}
                    </td>
                    <td className="px-2.5 py-2 text-xs" style={{ borderBottom: 'var(--border-subtle)' }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.impact === 'high' ? 'var(--fail)' : e.impact === 'medium' ? 'var(--warning)' : 'var(--text-tertiary)' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: e.impact === 'high' ? 'var(--fail)' : e.impact === 'medium' ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                          {e.impact || 'low'}
                        </span>
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-xs font-medium text-[var(--text-primary)]" style={{ borderBottom: 'var(--border-subtle)' }}>
                      {e.title || ''}
                    </td>
                    <td className="px-2.5 py-2 text-xs mono text-[var(--text-secondary)]" style={{ borderBottom: 'var(--border-subtle)' }}>
                      {e.forecast || '-'}
                    </td>
                    <td className="px-2.5 py-2 text-xs mono text-[var(--text-secondary)] max-sm:hidden" style={{ borderBottom: 'var(--border-subtle)' }}>
                      {e.previous || '-'}
                    </td>
                    <td className="px-2.5 py-2 text-xs mono max-sm:hidden" style={{ color: e.actual ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: 'var(--border-subtle)' }}>
                      {e.actual || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPanel;
