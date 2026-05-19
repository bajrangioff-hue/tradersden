import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Waves, TrendingUp, Zap, GitBranch, Crosshair, Link2, Compass } from 'lucide-react';
import { CHECKLIST_ITEMS } from '../../utils/constants';

const iconMap: Record<string, React.FC<{ size?: number }>> = {
  chart: (p) => <BarChart3 size={p.size || 14} />,
  wave: (p) => <Waves size={p.size || 14} />,
  trend: (p) => <TrendingUp size={p.size || 14} />,
  zap: (p) => <Zap size={p.size || 14} />,
  branch: (p) => <GitBranch size={p.size || 14} />,
  target: (p) => <Crosshair size={p.size || 14} />,
  link: (p) => <Link2 size={p.size || 14} />,
  compass: (p) => <Compass size={p.size || 14} />,
};

interface ChecklistProps {
  checklist: Record<string, { passed: boolean; detail: string }>;
}

const Checklist: React.FC<ChecklistProps> = ({ checklist }) => {
  const total = CHECKLIST_ITEMS.length;
  const passed = CHECKLIST_ITEMS.filter((i) => checklist[i.key]?.passed).length;

  return (
    <div className="bg-[var(--color-bg-glass)] border border-[var(--color-border-primary)] rounded-xl backdrop-blur-sm p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-text-tertiary)]">
          Elite Checklist
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-bg-glass)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]">
          {total} Checks
        </span>
      </div>
      {CHECKLIST_ITEMS.map((item, idx) => {
        const isPass = checklist[item.key]?.passed;
        const Icon = iconMap[item.icon] || iconMap.chart;
        return (
          <motion.div
            key={item.key}
            className="flex items-center gap-3 py-2.5 not-last:border-b not-last:border-[var(--color-border-secondary)] hover:opacity-90 transition-opacity"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isPass
                  ? 'bg-[var(--color-status-pass)]/15 text-[var(--color-status-pass)]'
                  : 'bg-[var(--color-status-fail)]/15 text-[var(--color-status-fail)]'
              }`}
            >
              <Icon size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{item.label}</div>
              <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{item.sub}</div>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider mono shrink-0 border ${
                isPass
                  ? 'bg-[var(--color-status-pass)]/15 text-[var(--color-status-pass)] border-[var(--color-status-pass)]/30'
                  : 'bg-[var(--color-status-fail)]/15 text-[var(--color-status-fail)] border-[var(--color-status-fail)]/30'
              }`}
            >
              {isPass ? 'PASS' : 'FAIL'}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Checklist;
