import React from 'react';
import type { AnalysisResult } from '../../types';

interface HeroAnalysisCardProps {
  data: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  currentSymbol: string;
  isPinned: boolean;
  onTogglePin: () => void;
}

const HeroAnalysisCard: React.FC<HeroAnalysisCardProps> = ({ data, loading, error, currentSymbol, isPinned, onTogglePin }) => {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-24 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-12 w-48 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-4 w-36 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--fail-dim)', border: 'var(--border-fail)' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--fail)' }}>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const score = data.confluence_score ?? data.score ?? 0;
  const grade = data.grade_letter ?? data.grade ?? 'N/A';
  const confidence = data.confidence ?? (score >= 7 ? 'HIGH' : score >= 4 ? 'MODERATE' : 'LOW');
  const direction = data.direction ?? 'NEUTRAL';

  const statusText = data.no_trade ? 'NO TRADE' : score >= 7 ? 'STRONG SETUP' : score >= 4 ? 'MODERATE SETUP' : 'WEAK SETUP';
  const statusColor = data.no_trade ? 'var(--fail)' : score >= 7 ? 'var(--pass)' : score >= 4 ? 'var(--warn)' : 'var(--fail)';

  const recColor = score >= 7 ? 'var(--pass)' : score >= 4 ? 'var(--warn)' : 'var(--fail)';
  const recText = data.no_trade
    ? (data.no_trade_reason ?? 'NO TRADE')
    : score >= 7 ? 'HIGH PROBABILITY' : score >= 4 ? 'CAUTION' : 'AVOID';

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-tertiary) 100%)',
        border: 'var(--border-subtle)',
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, var(--accent), transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, var(--accent), transparent)', transform: 'translate(-20%, 20%)' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{currentSymbol}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: direction === 'BULLISH' ? 'var(--pass-dim)' : direction === 'BEARISH' ? 'var(--fail-dim)' : 'rgba(100,116,139,0.15)', color: direction === 'BULLISH' ? 'var(--pass)' : direction === 'BEARISH' ? 'var(--fail)' : 'var(--text-tertiary)' }}>
              {direction}
            </span>
          </div>
          <button
            onClick={onTogglePin}
            className="p-2 rounded-lg cursor-pointer border-none transition-all"
            style={{ background: isPinned ? 'var(--accent-dim)' : 'transparent', color: isPinned ? 'var(--accent)' : 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { if (!isPinned) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            onMouseLeave={(e) => { if (!isPinned) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; } }}
            title={isPinned ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </button>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-5xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{score.toFixed(1)}</span>
          <span className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>/ 10</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg uppercase" style={{ background: `${statusColor}20`, color: statusColor }}>{statusText}</span>
        </div>

        <div className="flex items-center gap-6 mb-4 text-sm">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Grade</span>
            <div className="text-lg font-bold font-mono mt-0.5" style={{ color: grade === 'A+' ? 'var(--grade-aplus)' : grade === 'A' ? 'var(--grade-a)' : grade === 'B' ? 'var(--grade-b)' : 'var(--grade-f)' }}>{grade}</div>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Confidence</span>
            <div className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{typeof confidence === 'number' ? `${confidence}%` : confidence}</div>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Recommendation</span>
            <div className="text-lg font-bold mt-0.5" style={{ color: recColor }}>{recText}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--pass)]" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroAnalysisCard;
