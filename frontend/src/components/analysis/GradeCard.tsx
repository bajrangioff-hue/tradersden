import React from 'react';
import { motion } from 'framer-motion';
import { Pin, PinOff } from 'lucide-react';
import { useMarketStore } from '../../hooks/useMarketStore';

interface GradeCardProps {
  grade: number;
  gradeLetter: string;
  session: string;
  direction: string;
  passedCount: number;
  totalChecks: number;
  currentSymbol: string;
  isPinned: boolean;
  onTogglePin: (sym: string) => void;
  structureState?: string;
  liquidityState?: string;
  oteState?: string;
  confluenceScore?: number;
  noTrade?: boolean;
  noTradeReason?: string | null;
  sessionQuality?: string;
  amdPhase?: string;
  dailyBias?: string;
}

const gradeColors: Record<string, string> = {
  'A+': 'var(--grade-aplus)',
  'A': 'var(--grade-a)',
  'B': 'var(--grade-b)',
  'F': 'var(--grade-f)',
};

const ConfluenceDonut: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      <svg width="72" height="72" className="absolute" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bg-border)" strokeWidth="4" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span className="text-[20px] font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
};

const GradeCard: React.FC<GradeCardProps> = ({
  grade, gradeLetter, session, direction, passedCount, totalChecks,
  currentSymbol, isPinned, onTogglePin, structureState, liquidityState, oteState,
  confluenceScore, noTrade, noTradeReason, sessionQuality, amdPhase, dailyBias,
}) => {
  const letter = gradeLetter || 'F';
  const gc = gradeColors[letter] || 'var(--grade-f)';
  const isBullish = direction === 'BULLISH';
  const score = confluenceScore ?? grade * 10;
  const livePrice = useMarketStore().getPrice(currentSymbol);

  return (
    <motion.div
      className="card-surface relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <button
        className="absolute top-4 right-4 p-1 rounded cursor-pointer bg-transparent border-none transition-colors"
        style={{ color: isPinned ? 'var(--accent)' : 'var(--text-dim)' }}
        onClick={() => onTogglePin(currentSymbol)}
        title={isPinned ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>

      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold font-mono text-[var(--text-primary)]">{currentSymbol}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}>
              {currentSymbol.includes('=F') || currentSymbol.includes('F=') ? 'CME' : currentSymbol.includes('-USD') ? 'CRYPTO' : currentSymbol.includes('=X') ? 'FX' : 'NYSE'}
            </span>
            {livePrice && (
              <span className="text-[14px] font-mono font-bold" style={{ color: livePrice.c >= 0 ? 'var(--pass)' : 'var(--fail)' }}>
                ${livePrice.p.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Score <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>{score}</span>
            </span>
            <span className="text-[var(--text-dim)]">·</span>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {passedCount}/{totalChecks} checks
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="font-mono text-[64px] font-extrabold leading-none tracking-tight" style={{ color: gc }}>
            {letter}
          </div>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <ConfluenceDonut score={score} color={gc} />
          <span className="text-[9px] font-semibold tracking-wider mt-0.5" style={{ color: 'var(--text-dim)' }}>CONFLUENCE</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {[
          { label: 'STRUCTURE', value: structureState || 'RANGING' },
          { label: 'LIQUIDITY', value: liquidityState || 'NONE' },
          { label: 'OTE', value: oteState || 'MISSED' },
        ].map((b) => {
          const isGood = b.value === 'BOS/CHoCH' || b.value === 'CLEAR' || b.value === 'IN ZONE';
          const isMid = b.value === 'CHoCH' || b.value === 'LIMITED' || b.value === 'NEAR';
          const c = isGood ? 'var(--pass)' : isMid ? 'var(--warn)' : 'var(--fail)';
          return (
            <div key={b.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', borderLeft: `2px solid ${c}` }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{b.label}:</span>
              <span style={{ color: c }}>{b.value}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold" style={{ background: isBullish ? 'var(--pass-dim)' : 'var(--fail-dim)', color: isBullish ? 'var(--pass)' : 'var(--fail)' }}>
          {isBullish ? '↑' : '↓'} {direction}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[11px] font-mono flex-wrap pt-3" style={{ borderTop: '1px solid rgba(39,39,42,0.4)', color: 'var(--text-dim)' }}>
        <span>SESSION: <span style={{ color: sessionQuality === 'PRIME' ? 'var(--pass)' : 'var(--text-secondary)' }}>{session}</span></span>
        <span className="text-[var(--bg-border)]">/</span>
        <span>BIAS: <span style={{ color: dailyBias === 'bullish' ? 'var(--pass)' : dailyBias === 'bearish' ? 'var(--fail)' : 'var(--text-tertiary)' }}>{(dailyBias || 'neutral').toUpperCase()}</span></span>
        <span className="text-[var(--bg-border)]">/</span>
        <span>PHASE: <span style={{ color: 'var(--accent)' }}>{(amdPhase || 'unknown').toUpperCase()}</span></span>
      </div>

      {noTrade && (
        <div className="mt-3 px-3 py-2 rounded-md text-[11px] font-semibold flex items-center gap-2" style={{ background: 'var(--fail-dim)', borderLeft: '2px solid var(--fail)' }}>
          <span style={{ color: 'var(--fail)' }}>NO TRADE</span>
          <span style={{ color: 'var(--text-secondary)' }}>— {noTradeReason || 'Invalid setup'}</span>
        </div>
      )}
    </motion.div>
  );
};

export default GradeCard;
