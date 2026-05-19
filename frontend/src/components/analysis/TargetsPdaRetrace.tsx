import React from 'react';
import type { Targets, Pda, Retracement } from '../../types';

interface TargetsPdaRetraceProps {
  targets: Targets | null;
  pda: Pda | null;
  retracement: Retracement | null;
}

const DetailRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
    <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    <span className={`text-xs font-semibold font-mono ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
      {value}
    </span>
  </div>
);

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl p-5 mt-4" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
    <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)] mb-3">{title}</div>
    {children}
  </div>
);

const TargetLevelBar: React.FC<{ label: string; price: number; entry: number; totalRange: number; color: string }> = ({ label, price, entry, totalRange, color }) => {
  const pct = totalRange > 0 ? Math.abs((price - entry) / totalRange) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-bold font-mono w-8 shrink-0" style={{ color }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-[var(--text-primary)] w-20 text-right">${price}</span>
    </div>
  );
};

const TargetsPdaRetrace: React.FC<TargetsPdaRetraceProps> = ({ targets, pda, retracement }) => {
  const targetLevels = targets?.targets?.length ? targets.targets : [];
  const entry = targets?.entry ?? null;
  const direction = targets?.direction || '';
  const isBullish = direction === 'BULLISH';
  const t3price = targetLevels.length >= 3 ? targetLevels[2].price : (targetLevels.length >= 1 ? targetLevels[targetLevels.length - 1].price : 0);
  const totalRange = entry != null ? Math.abs(t3price - entry) : 1;

  return (
    <>
      {targetLevels.length > 0 && entry != null ? (
        <DetailSection title={`Target Levels`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[var(--text-tertiary)]">Direction:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isBullish ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`} style={{ background: isBullish ? 'var(--pass-dim)' : 'var(--fail-dim)' }}>
              {direction}
            </span>
          </div>
          <TargetLevelBar label="ENTRY" price={entry} entry={entry} totalRange={totalRange} color="var(--accent)" />
          {targetLevels.map((t) => (
            <TargetLevelBar
              key={t.level}
              label={`T${t.level}`}
              price={t.price}
              entry={entry}
              totalRange={totalRange}
              color="var(--pass)"
            />
          ))}
        </DetailSection>
      ) : null}
      {pda?.yesterday_high != null ? (
        <DetailSection title="PDA (Previous Day Area)">
          <DetailRow label="Yesterday High" value={`$${pda.yesterday_high}`} />
          <DetailRow label="Yesterday Low" value={`$${pda.yesterday_low}`} />
          <DetailRow label="Yesterday Close" value={`$${pda.yesterday_close}`} />
        </DetailSection>
      ) : null}
      {retracement?.fib_level != null ? (
        <DetailSection title="Retracement">
          <DetailRow label="Fib 0.618" value={`$${retracement.fib_level}`} accent />
          <DetailRow label="Current Retrace" value={`${(retracement.current_retrace * 100).toFixed(1)}%`} />
        </DetailSection>
      ) : null}
    </>
  );
};

export default TargetsPdaRetrace;
