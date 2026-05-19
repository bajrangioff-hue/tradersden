import React from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { format } from 'date-fns';
import CalendarHeatmap from '../components/calendar/CalendarHeatmap';
import DailyTradesList from '../components/calendar/DailyTradesList';
import { useCalendarData } from '../hooks/useCalendarData';
import type { DayData } from '../hooks/useCalendarData';

const CalendarPage: React.FC = () => {
  const {
    days, totalPnl, winRate, bestDay, worstDay, maxPnl, loading, error, currentMonth, setCurrentMonth,
  } = useCalendarData();

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const selectedDay = selectedDate ? days.find((d) => d.date === selectedDate) : null;

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Month Navigation */}
      <div className="card-surface p-3 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((d: Date) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <ChevronLeft size={14} />
          {format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1), 'MMM')}
        </button>

        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </span>

        <button
          onClick={() => setCurrentMonth((d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          {format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1), 'MMM')}
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-surface p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">Total P&L</span>
          </div>
          <span className={`text-lg font-bold font-mono ${totalPnl >= 0 ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </div>

        <div className="card-surface p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">Win Rate</span>
          </div>
          <span className={`text-lg font-bold font-mono ${winRate >= 50 ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
            {winRate.toFixed(1)}%
          </span>
        </div>

        <div className="card-surface p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[var(--pass)]" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">Best Day</span>
          </div>
          <span className="text-lg font-bold font-mono text-[var(--pass)]">
            {bestDay ? `+$${bestDay.pnl.toFixed(2)}` : '-'}
          </span>
          {bestDay && <span className="text-[10px] text-[var(--text-dim)] ml-1">{bestDay.date}</span>}
        </div>

        <div className="card-surface p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-[var(--fail)]" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">Worst Day</span>
          </div>
          <span className="text-lg font-bold font-mono text-[var(--fail)]">
            {worstDay ? `-$${Math.abs(worstDay.pnl).toFixed(2)}` : '-'}
          </span>
          {worstDay && <span className="text-[10px] text-[var(--text-dim)] ml-1">{worstDay.date}</span>}
        </div>
      </div>

      {error && (
        <div className="text-xs text-[var(--fail)] bg-[var(--fail-dim)] rounded-lg px-4 py-2">{error}</div>
      )}

      {/* Heatmap */}
      <CalendarHeatmap
        days={days}
        currentMonth={currentMonth}
        maxPnl={maxPnl}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Loading */}
      {loading && (
        <div className="text-xs text-[var(--text-dim)] text-center py-4 shimmer">Loading trade data...</div>
      )}

      {/* Selected Day Trades */}
      {selectedDay && selectedDay.tradeCount > 0 && (
        <DailyTradesList
          trades={selectedDay.trades}
          date={selectedDay.date}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {selectedDay && selectedDay.tradeCount === 0 && (
        <div className="card-surface p-4 text-center">
          <span className="text-xs text-[var(--text-dim)]">No trades on this day.</span>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
