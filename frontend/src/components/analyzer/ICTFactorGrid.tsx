import React from 'react';
import { TrendingUp, Square, AlignCenter, Droplets, Clock, Layers, GitMerge, Target } from 'lucide-react';

interface ICTFactorGridProps {
  checklist: Record<string, { passed: boolean; detail: string }> | null | undefined;
  loading?: boolean;
}

const ICT_ITEMS = [
  { key: 'market_structure', label: 'Market Structure', icon: TrendingUp, desc: 'BOS / CHoCH Confirmed' },
  { key: 'order_block', label: 'Order Blocks', icon: Square, desc: 'Valid OB at Entry' },
  { key: 'fair_value_gap', label: 'FVG Liquidity', icon: AlignCenter, desc: 'Unmitigated FVG Present' },
  { key: 'liquidity_sweep', label: 'Liquidity Sweep', icon: Droplets, desc: 'BSL / SSL Swept' },
  { key: 'killzone', label: 'Kill Zone', icon: Clock, desc: 'London / NY Prime Time' },
  { key: 'premium_discount', label: 'Premium / Discount', icon: Layers, desc: 'Price in Correct Zone' },
  { key: 'ote_retracement', label: 'Risk / Reward', icon: GitMerge, desc: '62-79% Fibonacci OTE' },
  { key: 'draw_on_liquidity', label: 'Narrative Align', icon: Target, desc: 'Clear BSL / SSL Target' },
];

const SCORE_LABELS: Record<string, string> = {
  market_structure: 'Score',
  order_block: 'Score',
  fair_value_gap: 'Score',
  liquidity_sweep: 'Score',
  killzone: 'Score',
  premium_discount: 'Score',
  ote_retracement: 'Score',
  draw_on_liquidity: 'Score',
};

const getDisplayState = (key: string, passed: boolean): string => {
  if (!passed) return 'MISSING';
  const stateMap: Record<string, string> = {
    market_structure: 'BULLISH',
    order_block: 'HOLDING',
    fair_value_gap: 'PRESENT',
    liquidity_sweep: 'CONFIRMED',
    killzone: 'ACTIVE',
    premium_discount: 'OPTIMAL',
    ote_retracement: 'IN ZONE',
    draw_on_liquidity: 'STRONG',
  };
  return stateMap[key] ?? 'CONFIRMED';
};

const ICTFactorGrid: React.FC<ICTFactorGridProps> = ({ checklist, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
            <div className="h-3 w-20 rounded mb-2" style={{ background: 'var(--bg-hover)' }} />
            <div className="h-4 w-16 rounded mb-1" style={{ background: 'var(--bg-hover)' }} />
            <div className="h-3 w-12 rounded" style={{ background: 'var(--bg-hover)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!checklist || Object.keys(checklist).length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {ICT_ITEMS.map((item) => {
        const check = checklist[item.key];
        const passed = check?.passed ?? false;
        const Icon = item.icon;
        const state = getDisplayState(item.key, passed);

        return (
          <div
            key={item.key}
            className="relative group rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: passed ? 'var(--accent-dim-2)' : 'var(--bg-surface)',
              border: passed ? 'var(--border-accent)' : 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                background: passed ? 'var(--accent-dim)' : 'rgba(100,116,139,0.15)',
              }}>
                <Icon size={13} style={{ color: passed ? 'var(--accent)' : 'var(--text-tertiary)' }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: passed ? 'var(--pass)' : 'var(--fail)' }}>
                {passed ? '✓' : '✗'}
              </span>
              <span className="text-sm font-semibold" style={{ color: passed ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {state}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</span>
              <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent)' }}>
                {passed ? '✓' : '—'}
              </span>
            </div>

            <div className="absolute -top-1 -right-1">
              <div className="w-2 h-2 rounded-full" style={{
                background: passed ? 'var(--pass)' : 'var(--fail)',
                boxShadow: passed ? '0 0 6px var(--pass)' : '0 0 6px var(--fail)',
              }} />
            </div>

            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(240,185,11,0.15)' }} />
          </div>
        );
      })}
    </div>
  );
};

export default ICTFactorGrid;
