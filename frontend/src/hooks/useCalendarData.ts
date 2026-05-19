import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';
import { listTrades } from '../lib/api';
import type { TradeOut } from '../types';

export interface DayData {
  date: string;
  pnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  trades: TradeOut[];
}

export interface CalendarData {
  days: DayData[];
  totalPnl: number;
  winRate: number;
  bestDay: DayData | null;
  worstDay: DayData | null;
  maxPnl: number;
}

export function useCalendarData() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [trades, setTrades] = useState<TradeOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthKey = format(currentMonth, 'yyyy-MM');

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateFrom = format(monthStart, "yyyy-MM-dd'T00:00:00'");
      const dateTo = format(monthEnd, "yyyy-MM-dd'T23:59:59'");
      const result = await listTrades({ page_size: 200, date_from: dateFrom, date_to: dateTo });
      setTrades(result.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dayDataMap = new Map<string, TradeOut[]>();
  for (const trade of trades) {
    const day = format(parseISO(trade.entry_time), 'yyyy-MM-dd');
    const existing = dayDataMap.get(day) || [];
    existing.push(trade);
    dayDataMap.set(day, existing);
  }

  let totalPnl = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let bestDay: DayData | null = null;
  let worstDay: DayData | null = null;
  let maxPnl = 0;

  const days: DayData[] = allDays.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTrades = dayDataMap.get(dateStr) || [];
    const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = dayTrades.filter((t) => t.outcome === 'WIN').length;
    const losses = dayTrades.filter((t) => t.outcome === 'LOSS').length;
    totalPnl += dayPnl;
    totalWins += wins;
    totalLosses += losses;
    const absPnl = Math.abs(dayPnl);
    if (absPnl > Math.abs(maxPnl)) maxPnl = dayPnl;
    if (dayTrades.length > 0) {
      if (!bestDay || dayPnl > bestDay.pnl) bestDay = { date: dateStr, pnl: dayPnl, tradeCount: dayTrades.length, wins, losses, trades: dayTrades };
      if (!worstDay || dayPnl < worstDay.pnl) worstDay = { date: dateStr, pnl: dayPnl, tradeCount: dayTrades.length, wins, losses, trades: dayTrades };
    }
    return { date: dateStr, pnl: dayPnl, tradeCount: dayTrades.length, wins, losses, trades: dayTrades };
  });

  const totalTrades = totalWins + totalLosses;
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  return {
    days,
    trades,
    totalPnl,
    winRate,
    bestDay: bestDay as DayData | null,
    worstDay: worstDay as DayData | null,
    maxPnl: Math.abs(maxPnl) || 1,
    loading,
    error,
    currentMonth,
    setCurrentMonth,
    refetch: fetchTrades,
  };
}
