import React from 'react';

interface KeyLevels {
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

interface ICTKeyLevelsProps {
  keyLevels: KeyLevels | undefined;
  pda: Pda | null;
  confidence?: string;
  noTrade?: boolean;
  noTradeReason?: string | null;
  session?: string;
  amdPhase?: string;
  dailyBias?: string;
}

const DetailRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => {
  const valColor = accent ? 'var(--accent)' : value === 'PASS' || value === 'HIGH' || value === 'BULLISH' ? 'var(--pass)' : value === 'FAIL' || value === 'LOW' || value === 'BEARISH' || value === 'AVOID' ? 'var(--fail)' : 'var(--text-primary)';
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(39,39,42,0.4)' }}>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-xs font-semibold font-mono" style={{ color: valColor }}>{value}</span>
    </div>
  );
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card-surface mt-4">
    <div className="text-[11px] font-semibold tracking-[0.08em] uppercase mb-3" style={{ color: 'var(--text-tertiary)' }}>{title}</div>
    {children}
  </div>
);

const ICTKeyLevels: React.FC<ICTKeyLevelsProps> = ({ keyLevels, pda, confidence, noTrade, noTradeReason, session, amdPhase, dailyBias }) => {
  return (
    <>
      {noTrade && (
        <DetailSection title="No Trade">
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs font-bold" style={{ color: 'var(--fail)' }}>AVOID</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{noTradeReason || 'No valid setup'}</span>
          </div>
        </DetailSection>
      )}
      <DetailSection title="ICT Session">
        <DetailRow label="Session" value={session || '--'} />
        <DetailRow label="AMD Phase" value={amdPhase || '--'} accent />
        <DetailRow label="Daily Bias" value={dailyBias || 'neutral'} />
        <DetailRow label="Confidence" value={confidence || '--'} />
      </DetailSection>
      <DetailSection title="ICT Key Levels">
        <DetailRow label="Equilibrium" value={keyLevels?.equilibrium != null ? `$${keyLevels.equilibrium.toFixed(2)}` : '--'} accent />
        <DetailRow label="DOL Target" value={keyLevels?.dol_target != null ? `$${keyLevels.dol_target.toFixed(2)}` : 'None'} />
        {keyLevels?.order_block && (
          <DetailRow label="Order Block" value={`$${keyLevels.order_block.low.toFixed(2)} - $${keyLevels.order_block.high.toFixed(2)}`} accent />
        )}
        {keyLevels?.fvg && (
          <DetailRow label="FVG" value={`$${keyLevels.fvg.bottom.toFixed(2)} - $${keyLevels.fvg.top.toFixed(2)}`} accent />
        )}
        {keyLevels?.ote_zone && (
          <DetailRow label="OTE Zone" value={`$${keyLevels.ote_zone.low.toFixed(2)} - $${keyLevels.ote_zone.high.toFixed(2)}`} accent />
        )}
      </DetailSection>
      {pda?.yesterday_high != null ? (
        <DetailSection title="PDA (Previous Day Area)">
          <DetailRow label="Yesterday High" value={`$${typeof pda.yesterday_high === 'number' ? pda.yesterday_high.toFixed(2) : pda.yesterday_high}`} />
          <DetailRow label="Yesterday Low" value={`$${typeof pda.yesterday_low === 'number' ? pda.yesterday_low.toFixed(2) : pda.yesterday_low}`} />
          <DetailRow label="Yesterday Close" value={`$${typeof pda.yesterday_close === 'number' ? pda.yesterday_close.toFixed(2) : pda.yesterday_close}`} />
        </DetailSection>
      ) : null}
    </>
  );
};

export default ICTKeyLevels;
