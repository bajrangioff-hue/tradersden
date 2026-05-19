import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfluenceChart from '../components/chart/ConfluenceChart';
import HeroAnalysisCard from '../components/analyzer/HeroAnalysisCard';
import ICTFactorGrid from '../components/analyzer/ICTFactorGrid';
import PriceTracker from '../components/analyzer/PriceTracker';
import QuickActions from '../components/analyzer/QuickActions';
import { analyzeConfluence, analyzeAndSave } from '../lib/api';
import type { ConfluenceAnalysis, OHLCV, AnalysisResult } from '../types';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState('SPY');
  const [interval, setInterval] = useState('1h');
  const [analysis, setAnalysis] = useState<ConfluenceAnalysis | null>(null);
  const [ohlcv, setOhlcv] = useState<OHLCV[]>([]);
  const [checklist, setChecklist] = useState<Record<string, { passed: boolean; detail: string }> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [showTradeForm, setShowTradeForm] = useState(false);

  const fetchAnalysis = useCallback(async (sym: string, tf: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await analyzeConfluence(sym, tf, '1mo');
      setAnalysis(result);

      const proxyResp = await fetch(`/api/v1/analyze/${encodeURIComponent(sym)}?es_symbol=ES%3DF`);
      if (proxyResp.ok) {
        const proxyData = await proxyResp.json();
        const data = proxyData.data;
        if (data?.ohlcv) setOhlcv(data.ohlcv);
        if (data?.checklist) setChecklist(data.checklist);
        setAnalysisResult(data ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis(symbol, interval);
  }, [symbol, interval, fetchAnalysis]);

  const handleSaveLevels = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      await analyzeAndSave(symbol, interval);
      const updated = await analyzeConfluence(symbol, interval, '1mo');
      setAnalysis(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogTrade = () => {
    navigate('/journal');
  };

  const topLevels = analysis?.levels?.slice(0, 6) || [];

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Hero Section */}
      <HeroAnalysisCard
        data={analysisResult}
        loading={loading}
        error={error}
        currentSymbol={symbol}
        isPinned={isPinned}
        onTogglePin={() => setIsPinned(!isPinned)}
      />

      {/* ICT Factor Grid */}
      {checklist && Object.keys(checklist).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>ICT Factor Breakdown</span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              {Object.values(checklist).filter((c) => c.passed).length}/{Object.keys(checklist).length}
            </span>
          </div>
          <ICTFactorGrid checklist={checklist} />
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && fetchAnalysis(symbol, interval)}
          className="w-24 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all uppercase"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
          placeholder="SPY"
        />
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setInterval(tf)}
              className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer border-none transition-all ${
                interval === tf ? 'text-black' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
              style={{ background: interval === tf ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              {tf}
            </button>
          ))}
        </div>
        <button
          onClick={handleSaveLevels}
          disabled={loading}
          className="px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50 border-none transition-all"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
        >
          {loading ? '...' : 'Save Levels'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3 space-y-5">
          {/* Chart */}
          <div className="rounded-xl overflow-hidden" style={{ border: 'var(--border-subtle)' }}>
            <ConfluenceChart data={ohlcv} levels={analysis?.levels || []} symbol={symbol} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <PriceTracker symbol={symbol} />

          {/* Score Card */}
          {analysis && (
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Confluence Score</div>
              <div className="text-3xl font-bold font-mono" style={{
                color: analysis.score >= 70 ? 'var(--pass)' : analysis.score >= 40 ? 'var(--warn)' : 'var(--fail)',
              }}>
                {analysis.score.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: analysis.direction === 'BULLISH' ? 'var(--pass-dim)' : analysis.direction === 'BEARISH' ? 'var(--fail-dim)' : 'rgba(100,116,139,0.15)', color: analysis.direction === 'BULLISH' ? 'var(--pass)' : analysis.direction === 'BEARISH' ? 'var(--fail)' : 'var(--text-tertiary)' }}>
                  {analysis.direction}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
                  background: analysis.grade === 'A+' || analysis.grade === 'A' ? 'var(--pass-dim)' : analysis.grade === 'B' ? 'var(--warn-dim)' : 'var(--fail-dim)',
                  color: analysis.grade === 'A+' || analysis.grade === 'A' ? 'var(--pass)' : analysis.grade === 'B' ? 'var(--warn)' : 'var(--fail)',
                }}>
                  {analysis.grade}
                </span>
              </div>
            </div>
          )}

          {/* Top Levels */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-tertiary)' }}>Top Levels</span>
            <div className="space-y-1.5">
              {topLevels.map((lvl, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{lvl.level_type}</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>${lvl.price.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded" style={{
                    color: lvl.confluence_score >= 80 ? 'var(--pass)' : lvl.confluence_score >= 50 ? 'var(--warn)' : 'var(--fail)',
                    background: lvl.confluence_score >= 80 ? 'var(--pass-dim)' : lvl.confluence_score >= 50 ? 'var(--warn-dim)' : 'var(--fail-dim)',
                  }}>
                    {lvl.confluence_score.toFixed(0)}
                  </span>
                </div>
              ))}
              {topLevels.length === 0 && !loading && (
                <div className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No levels detected</div>
              )}
            </div>
          </div>

          {/* Narrative */}
          {analysis?.narrative && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-tertiary)' }}>Narrative</span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{analysis.narrative}</p>
            </div>
          )}

          <QuickActions symbol={symbol} onLogTrade={handleLogTrade} isPinned={isPinned} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
