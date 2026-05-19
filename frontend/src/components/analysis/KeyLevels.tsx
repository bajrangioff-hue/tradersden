import React from 'react';

interface KeyLevelsData {
  order_block?: { high: number; low: number } | null;
  fvg?: { top: number; bottom: number } | null;
  ote_zone?: { high: number; low: number } | null;
  dol_target?: number | null;
  equilibrium?: number;
}

interface Pda {
  yesterday_high: number;
  yesterday_low: number;
  yesterday_close: number;
}

interface KeyLevelsProps {
  keyLevels: KeyLevelsData | undefined;
  pda: Pda | null;
}

interface LevelRow {
  label: string;
  price: number;
  dotColor: string;
  tag: string;
  tagColor: string;
}

const KeyLevels: React.FC<KeyLevelsProps> = ({ keyLevels, pda }) => {
  const levels: LevelRow[] = [];

  if (pda?.yesterday_high) {
    levels.push({ label: 'PDH', price: pda.yesterday_high, dotColor: 'var(--fail)', tag: 'BSL', tagColor: 'var(--fail)' });
  }
  if (keyLevels?.order_block) {
    levels.push({ label: 'OB HI', price: keyLevels.order_block.high, dotColor: 'var(--accent)', tag: 'OB', tagColor: 'var(--accent)' });
  }
  if (keyLevels?.fvg) {
    levels.push({ label: 'FVG', price: keyLevels.fvg.top, dotColor: 'var(--accent)', tag: 'FVG', tagColor: 'var(--accent)' });
  }
  if (keyLevels?.equilibrium) {
    levels.push({ label: 'EQ', price: keyLevels.equilibrium, dotColor: 'var(--accent)', tag: 'EQ', tagColor: 'var(--accent)' });
  }
  if (keyLevels?.ote_zone) {
    levels.push({ label: 'OTE', price: keyLevels.ote_zone.high, dotColor: 'var(--accent)', tag: 'OTE', tagColor: 'var(--accent)' });
  }
  if (keyLevels?.dol_target) {
    const isBsl = keyLevels.dol_target > (keyLevels.equilibrium || 0);
    levels.push({ label: 'DOL', price: keyLevels.dol_target, dotColor: isBsl ? 'var(--fail)' : 'var(--pass)', tag: isBsl ? 'BSL' : 'SSL', tagColor: isBsl ? 'var(--fail)' : 'var(--pass)' });
  }
  if (pda?.yesterday_low) {
    levels.push({ label: 'PDL', price: pda.yesterday_low, dotColor: 'var(--pass)', tag: 'SSL', tagColor: 'var(--pass)' });
  }

  levels.sort((a, b) => b.price - a.price);

  const currentPrice = levels.length > 0 ? levels[Math.floor(levels.length / 2)].price : 0;

  return (
    <div className="card-surface mt-4">
      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase mb-3" style={{ color: 'var(--text-tertiary)' }}>Key Levels</div>
      <div className="space-y-0.5">
        {levels.map((lvl, i) => {
          const dist = currentPrice ? ((lvl.price - currentPrice) / currentPrice * 10000).toFixed(1) : '0.0';
          const isCurrent = currentPrice && Math.abs(lvl.price - currentPrice) / currentPrice < 0.002;
          return (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-md text-[12px]" style={{ background: isCurrent ? 'var(--accent-dim)' : 'transparent' }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: lvl.dotColor }} />
              <span className="w-10 text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{lvl.label}</span>
              <span className="flex-1 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>${typeof lvl.price === 'number' ? lvl.price.toFixed(2) : '---'}</span>
              <span className="text-[10px] w-14 text-right" style={{ color: 'var(--text-dim)' }}>{dist}pt</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: `${lvl.tagColor}18`, color: lvl.tagColor }}>{lvl.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyLevels;
