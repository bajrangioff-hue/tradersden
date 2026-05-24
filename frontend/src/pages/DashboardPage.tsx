import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import TopBar from '../components/dashboard/TopBar'
import SubHeader from '../components/dashboard/SubHeader'
import StatCards from '../components/dashboard/StatCards'
import WinningPercentage from '../components/dashboard/WinningPercentage'
import DailyCumulativePnL from '../components/dashboard/DailyCumulativePnL'
import NetDailyPnL from '../components/dashboard/NetDailyPnL'
import TabsTable, { type PositionRow } from '../components/dashboard/TabsTable'
import Calendar from '../components/dashboard/Calendar'
import JournalPage from './JournalPage'
import StatisticsPage from './StatisticsPage'
import SetupsPage from './SetupsPage'
import LevelsPage from './LevelsPage'
import ReportsPage from './ReportsPage'
import NotebookPage from './NotebookPage'
import type { TradeOut } from '../types'
import {
  fetchDashboardStats,
  fetchPnLSeries,
  fetchCalendarData,
  listTrades,
  type DashboardStats,
  type PnLSeriesPoint,
  type CalendarDay,
} from '../lib/api'

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  journal: 'Trade Journal',
  analytics: 'Analytics',
  reports: 'Reports',
  strategies: 'Strategies',
  notebook: 'Notebook',
}

export default function DashboardPage() {
  const [activePage, setActivePage] = useState('dashboard')
  const [journalFormOpen, setJournalFormOpen] = useState(false)
  const [journalKey, setJournalKey] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pnlSeries, setPnlSeries] = useState<PnLSeriesPoint[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [openPositions, setOpenPositions] = useState<PositionRow[]>([])
  const [recentTrades, setRecentTrades] = useState<PositionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  const firstDay = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()}`

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  const mockTrades: TradeOut[] = [
    { id: 'm1', symbol: 'ES', direction: 'LONG', entry_price: 4200.50, exit_price: 4245.75, quantity: 2, commission: 3.50, pnl: 905.00, outcome: 'WIN', entry_time: '2026-05-04T09:30:00Z', exit_time: '2026-05-04T14:15:00Z', session: 'NY AM', setup_tags: ['ICT OTE'], notes: 'Clean OTE entry on 1H FVG', created_at: '2026-05-04T09:30:00Z', updated_at: '2026-05-04T14:15:00Z', stop_loss: 4175.25, take_profit: 4250.00 },
    { id: 'm2', symbol: 'NQ', direction: 'SHORT', entry_price: 18200.00, exit_price: 18125.50, quantity: 1, commission: 2.50, pnl: 745.00, outcome: 'WIN', entry_time: '2026-05-05T10:00:00Z', exit_time: '2026-05-05T12:30:00Z', session: 'NY AM', setup_tags: ['Breaker Block'], notes: 'Breaker block held perfectly', created_at: '2026-05-05T10:00:00Z', updated_at: '2026-05-05T12:30:00Z', stop_loss: 18280.00, take_profit: 18100.00 },
    { id: 'm3', symbol: 'RTY', direction: 'LONG', entry_price: 2010.00, exit_price: 1995.50, quantity: 3, commission: 4.00, pnl: -435.00, outcome: 'LOSS', entry_time: '2026-05-06T07:00:00Z', exit_time: '2026-05-06T08:45:00Z', session: 'London', setup_tags: ['FVG Fill'], notes: 'FVG failed to hold', created_at: '2026-05-06T07:00:00Z', updated_at: '2026-05-06T08:45:00Z', stop_loss: 1995.00, take_profit: 2040.00 },
    { id: 'm4', symbol: 'YM', direction: 'SHORT', entry_price: 38500.00, exit_price: 38420.00, quantity: 1, commission: 2.00, pnl: 80.00, outcome: 'WIN', entry_time: '2026-05-07T13:30:00Z', exit_time: '2026-05-07T15:00:00Z', session: 'NY PM', setup_tags: ['Liquidity Sweep'], notes: 'Scalp after liquidity sweep', created_at: '2026-05-07T13:30:00Z', updated_at: '2026-05-07T15:00:00Z', stop_loss: 38580.00, take_profit: 38400.00 },
    { id: 'm5', symbol: 'ES', direction: 'LONG', entry_price: 4215.00, exit_price: 4208.00, quantity: 2, commission: 3.00, pnl: -140.00, outcome: 'LOSS', entry_time: '2026-05-08T09:45:00Z', exit_time: '2026-05-08T10:30:00Z', session: 'NY AM', setup_tags: ['Order Block'], notes: 'Premature entry OB not confirmed', created_at: '2026-05-08T09:45:00Z', updated_at: '2026-05-08T10:30:00Z', stop_loss: 4205.00, take_profit: 4240.00 },
    { id: 'm6', symbol: 'NQ', direction: 'LONG', entry_price: 18350.00, exit_price: 18480.00, quantity: 2, commission: 4.00, pnl: 2600.00, outcome: 'WIN', entry_time: '2026-05-11T06:30:00Z', exit_time: '2026-05-11T16:00:00Z', session: 'London', setup_tags: ['CISD'], notes: 'CISD on NQ runner', created_at: '2026-05-11T06:30:00Z', updated_at: '2026-05-11T16:00:00Z', stop_loss: 18200.00, take_profit: 18500.00 },
    { id: 'm7', symbol: 'RTY', direction: 'SHORT', entry_price: 1985.00, exit_price: 1992.00, quantity: 2, commission: 2.50, pnl: -140.00, outcome: 'BREAK_EVEN', entry_time: '2026-05-12T14:00:00Z', exit_time: '2026-05-12T15:30:00Z', session: 'NY PM', setup_tags: ['ICT OTE'], notes: 'Tight stop, stopped out', created_at: '2026-05-12T14:00:00Z', updated_at: '2026-05-12T15:30:00Z', stop_loss: 1995.00, take_profit: 1960.00 },
    { id: 'm8', symbol: 'ES', direction: 'SHORT', entry_price: 4230.00, exit_price: 4185.50, quantity: 3, commission: 3.50, pnl: 1335.00, outcome: 'WIN', entry_time: '2026-05-13T08:00:00Z', exit_time: '2026-05-13T11:30:00Z', session: 'NY AM', setup_tags: ['FVG Fill'], notes: 'Nice FVG fill then continuation', created_at: '2026-05-13T08:00:00Z', updated_at: '2026-05-13T11:30:00Z', stop_loss: 4250.00, take_profit: 4175.00 },
    { id: 'm9', symbol: 'YM', direction: 'LONG', entry_price: 38650.00, exit_price: 38780.00, quantity: 1, commission: 2.00, pnl: 130.00, outcome: 'WIN', entry_time: '2026-05-14T09:00:00Z', exit_time: '2026-05-14T10:15:00Z', session: 'NY AM', setup_tags: ['Liquidity Sweep'], notes: 'Quick scalp', created_at: '2026-05-14T09:00:00Z', updated_at: '2026-05-14T10:15:00Z', stop_loss: 38580.00, take_profit: 38800.00 },
    { id: 'm10', symbol: 'NQ', direction: 'SHORT', entry_price: 18400.00, exit_price: 18450.00, quantity: 2, commission: 3.00, pnl: -1000.00, outcome: 'LOSS', entry_time: '2026-05-15T23:00:00Z', exit_time: '2026-05-16T01:30:00Z', session: 'Asia', setup_tags: ['Breaker Block'], notes: 'Breaker faked out overnight', created_at: '2026-05-15T23:00:00Z', updated_at: '2026-05-16T01:30:00Z', stop_loss: 18460.00, take_profit: 18250.00 },
  ]

  const mockPnlSeries: PnLSeriesPoint[] = [
    { date: '2025-11-01', display: 'Nov', pnl: 850, cumulative_pnl: 10850 },
    { date: '2025-12-01', display: 'Dec', pnl: 1200, cumulative_pnl: 12050 },
    { date: '2026-01-01', display: 'Jan', pnl: -420, cumulative_pnl: 11630 },
    { date: '2026-02-01', display: 'Feb', pnl: 2100, cumulative_pnl: 13730 },
    { date: '2026-03-01', display: 'Mar', pnl: 3400, cumulative_pnl: 17130 },
    { date: '2026-04-01', display: 'Apr', pnl: -680, cumulative_pnl: 16450 },
    { date: '2026-05-01', display: 'May', pnl: 1650, cumulative_pnl: 18100 },
  ]

  const mapMock = (t: TradeOut) => ({
    openDate: t.entry_time.split('T')[0],
    symbol: t.symbol,
    netPnl: (t.pnl ?? 0) >= 0 ? `+$${(t.pnl ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `-$${Math.abs(t.pnl ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
    positive: (t.pnl ?? 0) >= 0,
    direction: t.direction,
    rValue: '',
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, pnl, cal, openRes, recentRes] = await Promise.all([
        fetchDashboardStats(monthStr),
        fetchPnLSeries(firstDay, lastDay),
        fetchCalendarData(monthStr),
        listTrades({ page: 1, page_size: 100, outcome: 'OPEN' }),
        listTrades({ page: 1, page_size: 5 }),
      ])
      setStats(s)
      setPnlSeries(pnl.series)
      setCalendarDays(cal.days)

      const mapTrade = (t: TradeOut) => ({
        openDate: t.entry_time.split('T')[0],
        symbol: t.symbol,
        netPnl: (t.pnl ?? 0) >= 0 ? `+$${(t.pnl ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `-$${Math.abs(t.pnl ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        positive: (t.pnl ?? 0) >= 0,
        direction: t.direction,
        rValue: '',
      })

      setOpenPositions(openRes.trades.filter(t => t.outcome === 'OPEN' || !t.outcome).slice(0, 5).map(mapTrade))
      setRecentTrades(recentRes.trades.slice(0, 5).map(mapTrade))
    } catch (e) {
      setStats({
        net_pnl: 6842.50, net_pnl_change: 12.3,
        win_rate: 64, win_rate_change: 3.1,
        profit_factor: 1.85, max_drawdown: 8.2, avg_rr_ratio: 2.4,
        total_trades: 38, wins: 24, losses: 14, month: monthStr,
      })
      setPnlSeries(mockPnlSeries)
      const year = parseInt(monthStr.split('-')[0])
      const mon = parseInt(monthStr.split('-')[1])
      const calDays: CalendarDay[] = []
      const totalDays = new Date(year, mon, 0).getDate()
      const tradeDays = [2, 3, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30]
      for (let d = 1; d <= totalDays; d++) {
        const wd = new Date(year, mon - 1, d).getDay()
        if (wd === 0 || wd === 6) continue
        if (tradeDays.includes(d)) {
          const pnl = Math.round((Math.random() * 800 - 300) * 100) / 100
          calDays.push({ date: `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, pnl, trades: Math.floor(Math.random() * 4) + 1, positive: pnl >= 0 })
        }
      }
      setCalendarDays(calDays)
      setOpenPositions(mockTrades.filter(t => t.outcome === 'OPEN' || !t.outcome).slice(0, 5).map(mapMock))
      setRecentTrades(mockTrades.slice(0, 5).map(mapMock))
      console.warn('Dashboard API error, using mock data:', e)
    } finally {
      setLoading(false)
    }
  }, [monthStr, firstDay, lastDay])

  useEffect(() => {
    if (activePage === 'dashboard') fetchAll()
  }, [activePage, fetchAll])

  const renderPage = () => {
    switch (activePage) {
      case 'journal':
        return <JournalPage key={journalKey} defaultOpenForm={journalFormOpen} />
      case 'analytics':
        return <StatisticsPage />
      case 'strategies':
        return <SetupsPage />
      case 'levels':
        return <LevelsPage />
      case 'reports':
        return <ReportsPage />
      case 'notebook':
        return <NotebookPage />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8f9fc' }}>
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); setJournalFormOpen(false); }}
        onAddTrade={() => { setActivePage('journal'); setJournalFormOpen(true); setJournalKey(k => k + 1); }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={pageTitles[activePage] || 'Dashboard'} />
        {activePage === 'dashboard' ? (
          <>
            <SubHeader loading={loading} lastUpdated={stats ? 'Just now' : null} />
            <main className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
              {error && (
                <div className="mb-4 p-3 rounded-lg text-[13px] font-medium text-[#dc2626] bg-[#fee2e2]">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <StatCards stats={stats} loading={loading} />
                <div className="grid grid-cols-3 gap-4" style={{ gap: '14px' }}>
                  <WinningPercentage stats={stats} loading={loading} />
                  <DailyCumulativePnL data={pnlSeries} loading={loading} />
                  <NetDailyPnL data={pnlSeries} loading={loading} />
                </div>
                <div className="grid grid-cols-2 gap-4" style={{ gap: '14px' }}>
                  <TabsTable openPositions={openPositions} recentTrades={recentTrades} loading={loading} />
                  <Calendar days={calendarDays} loading={loading} currentMonth={currentMonth} onPrevMonth={goToPrevMonth} onNextMonth={goToNextMonth} />
                </div>
              </div>
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
            {renderPage()}
          </main>
        )}
      </div>
    </div>
  )
}
