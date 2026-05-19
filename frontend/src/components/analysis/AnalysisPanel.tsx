import React from 'react';
import { motion } from 'framer-motion';
import GradeCard from './GradeCard';
import EliteChecklist from './EliteChecklist';
import KeyLevels from './KeyLevels';
import ICTKeyLevels from './ICTKeyLevels';
import LoadingStates from '../common/LoadingStates';
import { AlertCircle, MessageSquareText } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import { CHECKLIST_ITEMS } from '../../utils/constants';

interface AnalysisPanelProps {
  data: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  currentSymbol?: string;
  isPinned?: boolean;
  onTogglePin?: (sym: string) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, loading, error, currentSymbol = '', isPinned = false, onTogglePin }) => {
  if (loading) return <LoadingStates type="analyze" symbol={currentSymbol} />;

  if (error) {
    return (
      <div className="card-surface p-5" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--fail)' }}>
          <AlertCircle size={16} /> Analysis failed
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black mb-4" style={{ background: 'var(--accent)' }}>
          <span style={{ color: 'white' }}>B</span>
        </div>
        <div className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Enter a symbol to begin analysis</div>
        <div className="flex gap-2">
          {['SPY', 'MNQ=F', 'NQ=F', 'EURUSD=X'].map((s) => (
            <button key={s} onClick={() => {}} className="px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer border-none"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const ch = data.checklist;
  const grade = data.grade ?? 0;
  const gradeLetter = data.grade_letter ?? '';
  const session = data.session ?? '--';
  const passedCount = CHECKLIST_ITEMS.filter((i) => ch[i.key]?.passed).length;

  return (
    <>
      <GradeCard
        grade={grade}
        gradeLetter={gradeLetter}
        session={session}
        direction={data.direction}
        passedCount={passedCount}
        totalChecks={CHECKLIST_ITEMS.length}
        currentSymbol={currentSymbol}
        isPinned={isPinned}
        onTogglePin={onTogglePin || (() => {})}
        structureState={data.delivery_state}
        liquidityState={data.target_state}
        oteState={data.retrace_state}
        confluenceScore={data.confluence_score}
        noTrade={data.no_trade}
        noTradeReason={data.no_trade_reason}
        sessionQuality={data.session_quality}
        amdPhase={data.amd_phase}
        dailyBias={data.daily_bias}
      />
      {data.narrative && (
        <motion.div
          className="card-surface mt-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareText size={13} style={{ color: 'var(--teal)' }} />
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--teal)' }}>
              Market Narrative
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {data.narrative}
          </p>
        </motion.div>
      )}
      <EliteChecklist checklist={ch} />
      <KeyLevels keyLevels={data.key_levels} pda={data.pda} />
      <ICTKeyLevels keyLevels={data.key_levels} pda={data.pda} confidence={data.confidence} noTrade={data.no_trade} noTradeReason={data.no_trade_reason} session={data.session} amdPhase={data.amd_phase} dailyBias={data.daily_bias} />
    </>
  );
};

export default AnalysisPanel;
