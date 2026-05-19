import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Square, AlignCenter, Droplets, Clock, Layers, GitMerge, Target } from 'lucide-react';

const ICT_ITEMS = [
  { key: 'market_structure', label: 'MARKET STRUCTURE', icon: TrendingUp },
  { key: 'order_block', label: 'ORDER BLOCK', icon: Square },
  { key: 'fair_value_gap', label: 'FAIR VALUE GAP', icon: AlignCenter },
  { key: 'liquidity_sweep', label: 'LIQUIDITY SWEEP', icon: Droplets },
  { key: 'killzone', label: 'KILLZONE', icon: Clock },
  { key: 'premium_discount', label: 'PREMIUM / DISCOUNT', icon: Layers },
  { key: 'ote_retracement', label: 'OTE RETRACEMENT', icon: GitMerge },
  { key: 'draw_on_liquidity', label: 'DRAW ON LIQUIDITY', icon: Target },
];

interface EliteChecklistProps {
  checklist: Record<string, { passed: boolean; detail: string }>;
}

const EliteChecklist: React.FC<EliteChecklistProps> = ({ checklist }) => {
  const total = ICT_ITEMS.length;
  const passed = ICT_ITEMS.filter((i) => checklist[i.key]?.passed).length;
  const pct = total > 0 ? (passed / total) * 100 : 0;

  const col1 = ICT_ITEMS.slice(0, 4);
  const col2 = ICT_ITEMS.slice(4);

  return (
    <div className="card-surface mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text-tertiary)' }}>ICT Checklist</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold font-mono" style={{ color: 'var(--accent)' }}>{passed}/{total}</span>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: passed >= 6 ? 'var(--pass)' : passed >= 4 ? 'var(--warn)' : 'var(--fail)' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[col1, col2].map((col, ci) => (
          <div key={ci} className="space-y-2">
            {col.map((item, idx) => {
              const check = checklist[item.key];
              const isPass = check?.passed ?? false;
              const Icon = item.icon;
              const globalIdx = ci * 4 + idx;
              return (
                <motion.div
                  key={item.key}
                  className="card-hover"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${isPass ? 'var(--pass)' : 'var(--fail)'}`,
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: globalIdx * 0.04, duration: 0.2 }}
                >
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{
                        background: isPass ? 'var(--pass-dim)' : 'var(--fail-dim)',
                      }}>
                        <Icon size={12} style={{ color: isPass ? 'var(--pass)' : 'var(--fail)' }} />
                      </div>
                      <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        background: isPass ? 'var(--pass-dim)' : 'var(--fail-dim)',
                        color: isPass ? 'var(--pass)' : 'var(--fail)',
                      }}
                    >
                      {isPass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="px-3 pb-2.5 text-[10px] leading-tight font-mono" style={{ color: 'var(--text-dim)' }}>{check?.detail || '—'}</div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EliteChecklist;
