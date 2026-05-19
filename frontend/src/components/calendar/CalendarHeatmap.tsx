import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, getDay, isSameMonth, isSameDay, isToday } from 'date-fns';
import type { DayData } from '../../hooks/useCalendarData';

interface CalendarHeatmapProps {
  days: DayData[];
  currentMonth: Date;
  maxPnl: number;
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

function pnlColor(pnl: number, maxPnl: number): string {
  if (pnl === 0) return 'var(--bg-elevated)';
  const intensity = Math.min(Math.abs(pnl) / maxPnl, 1);
  if (pnl > 0) {
    const g = Math.round(180 + (75 - 180) * intensity);
    return `rgba(34,${g},94,${0.15 + 0.6 * intensity})`;
  }
  const r = Math.round(180 + (239 - 180) * intensity);
  return `rgba(${r},68,68,${0.15 + 0.6 * intensity})`;
}

function textColor(pnl: number, maxPnl: number): string {
  if (pnl === 0) return 'var(--text-dim)';
  const intensity = Math.min(Math.abs(pnl) / maxPnl, 1);
  if (pnl > 0) return intensity > 0.6 ? '#fff' : 'var(--pass)';
  return intensity > 0.6 ? '#fff' : 'var(--fail)';
}

const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ days, currentMonth, maxPnl, selectedDate, onSelectDate }) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayMap = useMemo(() => {
    const m = new Map<string, DayData>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  for (const day of allDays) {
    currentWeek.push(day);
    if (getDay(day) === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) weeks.push(currentWeek);

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">
          P&L Heatmap
        </span>
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-0.5 pt-5">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="h-[14px] flex items-center text-[9px] text-[var(--text-dim)] font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-0.5" style={{ minWidth: weeks.length * 16 }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dd = dayMap.get(dateStr);
                  const pnl = dd?.pnl || 0;
                  const inMonth = isSameMonth(day, currentMonth);
                  const today = isToday(day);
                  const selected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => onSelectDate(selected ? null : dateStr)}
                      disabled={!inMonth || !dd?.tradeCount}
                      className="w-[14px] h-[14px] rounded-sm cursor-pointer border-none transition-all disabled:cursor-default flex items-center justify-center relative"
                      style={{
                        backgroundColor: inMonth && dd?.tradeCount ? pnlColor(pnl, maxPnl) : 'transparent',
                        outline: selected ? '2px solid var(--accent)' : today && inMonth ? '1px solid var(--accent)' : '1px solid transparent',
                        outlineOffset: selected ? '1px' : '0',
                      }}
                      title={inMonth && dd ? `${dateStr}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${dd.tradeCount} trades)` : dateStr}
                    >
                      {inMonth && dd?.tradeCount ? (
                        <span className="text-[7px] font-mono font-bold leading-none" style={{ color: textColor(pnl, maxPnl) }}>
                          {pnl > 0 ? '+' : pnl < 0 ? '-' : ''}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
