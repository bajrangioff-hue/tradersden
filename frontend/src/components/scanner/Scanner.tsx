import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../utils/constants';
import LoadingStates from '../common/LoadingStates';

interface ScanResult {
  symbol: string;
  grade: string;
  score: number;
  direction: string;
  session: string;
  checks_passed: number;
  no_trade: boolean;
}

interface ScannerProps {
  onSelectSymbol: (sym: string) => void;
}

const gradeColors: Record<string, string> = { 'A+': 'var(--grade-aplus)', A: 'var(--grade-a)', B: 'var(--grade-b)', F: 'var(--grade-f)' };

const Scanner: React.FC<ScannerProps> = ({ onSelectSymbol }) => {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'prime' | 'a+'>('all');
  const [lastUpdated, setLastUpdated] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchScanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/v1/scanner`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResults(json.data?.results ?? []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load scanner';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScanner();
    intervalRef.current = setInterval(fetchScanner, 300000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchScanner]);

  const filtered = results.filter((r) => {
    if (filter === 'a+') return r.grade === 'A+';
    if (filter === 'prime') return (r.grade === 'A+' || r.grade === 'A') && !r.no_trade;
    return true;
  });

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Market Scanner</span>
          <span className="text-[10px] font-mono text-[var(--text-dim)]">{filtered.length} results</span>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'prime', 'a+'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                filter === f ? 'text-white bg-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-transparent'
              }`}>
              {f === 'all' ? 'ALL' : f === 'prime' ? 'PRIME' : 'A+ ONLY'}
            </button>
          ))}
          <button onClick={fetchScanner} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer bg-transparent border-none">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {lastUpdated && <span className="text-[10px] font-mono text-[var(--text-dim)]">{lastUpdated}</span>}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={28} style={{ color: 'var(--fail)' }} />
          <div className="text-[11px] text-[var(--fail)] mt-2">{error}</div>
          <button onClick={fetchScanner}
            className="mt-3 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none transition-all"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
          >Retry</button>
        </div>
      ) : loading && results.length === 0 ? (
        <LoadingStates type="scanner" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search size={32} style={{ color: 'var(--text-dim)' }} />
          <div className="text-sm text-[var(--text-tertiary)] mt-2">No setups found</div>
          <div className="text-[11px] text-[var(--text-dim)]">Try adjusting filters</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="sticky top-0 z-10" style={{ background: 'var(--bg-elevated)' }}>
                {['SYMBOL', 'GRADE', 'SCORE', 'DIRECTION', 'SESSION', 'CHECKS', 'ACTION'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] text-left" style={{ borderBottom: 'var(--border-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const gc = gradeColors[r.grade] || 'var(--grade-f)';
                const isBullish = r.direction === 'BULLISH';
                return (
                  <motion.tr key={r.symbol}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`cursor-pointer transition-colors ${r.no_trade ? 'opacity-50' : ''} hover:bg-[var(--bg-hover)]`}
                    onClick={() => onSelectSymbol(r.symbol)}
                    style={{ borderBottom: 'var(--border-subtle)' }}
                  >
                    <td className="px-3 py-3">
                      <span className="text-[13px] font-semibold font-mono text-[var(--text-primary)]">{r.symbol}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[14px] font-bold font-mono px-1.5 py-0.5 rounded-md" style={{ color: gc, background: `${gc}22` }}>{r.grade}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono font-bold" style={{ color: 'var(--accent)' }}>{r.score}</span>
                        <div className="w-12 h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score >= 80 ? 'var(--pass)' : r.score >= 50 ? 'var(--warning)' : 'var(--fail)' }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[11px] font-bold ${isBullish ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
                        {isBullish ? '↑' : '↓'} {r.direction}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>{r.session || '--'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[12px] font-mono font-semibold text-[var(--text-secondary)]">{r.checks_passed}/8</span>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={(e) => { e.stopPropagation(); onSelectSymbol(r.symbol); }}
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all cursor-pointer border-none"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                        Analyze →
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Scanner;
