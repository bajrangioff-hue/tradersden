import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Header from './components/layout/Header';
import TabBar from './components/layout/TabBar';
import Sidebar from './components/layout/Sidebar';
import StatusBar from './components/layout/StatusBar';
import TickerTape from './components/layout/TickerTape';
import SymbolPills from './components/analysis/SymbolPills';
import AnalysisPanel from './components/analysis/AnalysisPanel';
import CalendarPanel from './components/calendar/CalendarPanel';
import CalendarPage from './pages/CalendarPage';
import LiveNewsPanel from './components/news/NewsPanel';
import Scanner from './components/scanner/Scanner';
import DashboardPage from './pages/DashboardPage';
import JournalPage from './pages/JournalPage';
import LevelsPage from './pages/LevelsPage';
import SetupsPage from './pages/SetupsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import PrivateRoute from './components/common/PrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './lib/auth';
import { MarketProvider } from './hooks/useMarketStore';
import { API_BASE, SPECIAL_TABS, WS_REFRESH } from './utils/constants';
import type { AnalysisResult, CalendarEvent } from './types';

interface WatchlistEntry {
  symbol: string;
  grade?: string;
  direction?: string;
}

function loadWatchlist(): WatchlistEntry[] {
  try { const s = localStorage.getItem('bt_watchlist'); return s ? JSON.parse(s) : []; }
  catch { return []; }
}

function saveWatchlist(items: WatchlistEntry[]) {
  localStorage.setItem('bt_watchlist', JSON.stringify(items));
}

const AppContent: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchVal, setSearchVal] = useState('SPY');
  const [activeTab, setActiveTabState] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(loadWatchlist);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarEvent[] | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [connected] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const fetchData = useCallback(async (symbol: string) => {
    setLoading(true); setApiError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/analyze/${encodeURIComponent(symbol)}?es_symbol=ES%3DF`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAnalysisResult(json.data);
    } catch (e: unknown) {
      setAnalysisResult(null);
      setApiError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setLoading(false); }
  }, []);

  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true); setCalendarError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/calendar`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCalendarData(json.data?.events ?? null);
    } catch (e: unknown) {
      setCalendarData(null);
      setCalendarError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setCalendarLoading(false); }
  }, []);

  const setActiveTab = useCallback((cid: string) => {
    clearRefresh();
    setActiveTabState(cid);
    setSidebarOpen(false);
    if (cid === 'calendar') {
      fetchCalendar();
      refreshTimerRef.current = setInterval(fetchCalendar, WS_REFRESH);
    }
  }, [clearRefresh, fetchCalendar]);

  const handleAnalyze = useCallback((sym: string) => {
    const s = sym.trim().toUpperCase() || 'SPY';
    setSearchVal(s); setSelectedSymbol(s); setActiveTabState('all');
    clearRefresh(); fetchData(s);
  }, [clearRefresh, fetchData]);

  const togglePin = useCallback((sym: string) => {
    setWatchlist((prev) => {
      const exists = prev.find((e) => e.symbol === sym);
      if (exists) {
        const next = prev.filter((e) => e.symbol !== sym);
        saveWatchlist(next);
        return next;
      }
      const entry: WatchlistEntry = {
        symbol: sym,
        grade: analysisResult?.grade_letter || undefined,
        direction: analysisResult?.direction || undefined,
      };
      const next = [...prev, entry];
      saveWatchlist(next);
      return next;
    });
  }, [analysisResult]);

  const removeFromWatchlist = useCallback((sym: string) => {
    setWatchlist((prev) => { const next = prev.filter((e) => e.symbol !== sym); saveWatchlist(next); return next; });
  }, []);

  const clearWatchlist = useCallback(() => { setWatchlist([]); saveWatchlist([]); }, []);

  useEffect(() => {
    if (analysisResult) {
      setWatchlist((prev) => {
        const idx = prev.findIndex((e) => e.symbol === analysisResult.symbol);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], grade: analysisResult.grade_letter || next[idx].grade, direction: analysisResult.direction || next[idx].direction };
        saveWatchlist(next);
        return next;
      });
    }
  }, [analysisResult]);

  useEffect(() => { fetchData('SPY'); return () => clearRefresh(); }, []); // eslint-disable-line

  const isSpecial = SPECIAL_TABS[activeTab] === 1;
  const isPinned = watchlist.some((e) => e.symbol === selectedSymbol);

  const mainContent = isSpecial ? (
    activeTab === 'calendar' ? (
      <CalendarPanel data={calendarData} loading={calendarLoading} error={calendarError} />
    ) : activeTab === 'scanner' ? (
      <Scanner onSelectSymbol={handleAnalyze} />
    ) : activeTab === 'news' ? (
      <LiveNewsPanel />
    ) : activeTab === 'dashboard' ? (
      <DashboardPage />
    ) : activeTab === 'journal' ? (
      <JournalPage />
    ) : activeTab === 'levels' ? (
      <LevelsPage />
    ) : activeTab === 'setups' ? (
      <SetupsPage />
    ) : activeTab === 'heatmap' ? (
      <CalendarPage />
    ) : activeTab === 'settings' ? (
      <SettingsPage />
    ) : activeTab === 'statistics' ? (
      <StatisticsPage />
    ) : (
      <LiveNewsPanel />
    )
  ) : (
    <AnalysisPanel data={analysisResult} loading={loading} error={apiError} currentSymbol={selectedSymbol} isPinned={isPinned} onTogglePin={togglePin} />
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MarketProvider>
      <div className="min-h-screen flex flex-col">
        <Header searchVal={searchVal} onSearchChange={setSearchVal} onAnalyze={handleAnalyze} activeTab={activeTab} onTabSelect={setActiveTab} connected={connected} />
        <TickerTape />
        <div className="flex flex-1">
          <Sidebar
            items={watchlist}
            mobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onRemove={removeFromWatchlist}
            onClear={clearWatchlist}
            onAnalyzeAll={() => watchlist.forEach((e) => fetchData(e.symbol))}
            onSelect={(sym) => { setSearchVal(sym); setSelectedSymbol(sym); fetchData(sym); setSidebarOpen(false); }}
            selectedSymbol={selectedSymbol}
          />
          <main className="flex-1 min-w-0 flex flex-col">
            <TabBar active={activeTab} onSelect={setActiveTab} />
            {!isSpecial && <SymbolPills activeTab={activeTab} selectedSymbol={selectedSymbol} onSelect={handleAnalyze} />}
            <div className="lg:hidden flex items-center px-4 lg:px-5 py-2">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' }}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={14} />
                Watchlist {watchlist.length > 0 && <span className="ml-1" style={{ color: 'var(--accent)' }}>{watchlist.length}</span>}
              </button>
            </div>
            <div className="flex-1 px-4 lg:px-5 py-4">
              {mainContent}
            </div>
          </main>
        </div>
        <StatusBar />
      </div>
    </MarketProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider apiBase={""}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/*" element={<PrivateRoute><AppContent /></PrivateRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
