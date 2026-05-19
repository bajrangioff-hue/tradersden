import React, { useMemo } from 'react';
import { useMarketStore } from '../../hooks/useMarketStore';
import { SYMBOLS_DATA } from '../../utils/constants';
import { formatPrice, formatChange, formatPct, getSessionInfo } from '../../utils/formatters';
import type { MarketPrice } from '../../types';

const tickerSymbols = [
  'MNQ=F', 'MES=F', 'NQ=F', 'ES=F',
  'GC=F', 'SI=F', 'CL=F', 'NG=F',
  'BTC-USD', 'ETH-USD',
  'EURUSD=X', 'GBPUSD=X', 'USDJPY=X',
];

function getMarketStatus(): { label: string; color: string; dot: string } {
  const h = new Date().getUTCHours();
  const d = new Date().getUTCDay();
  if (d === 0 || d === 6) return { label: 'CLOSED', color: 'var(--text-dim)', dot: 'var(--text-dim)' };
  if (h >= 13 && h < 21) return { label: 'RTH', color: 'var(--pass)', dot: 'var(--pass)' };
  if (h >= 21 || h < 1) return { label: 'ETH', color: 'var(--warn)', dot: 'var(--warn)' };
  return { label: 'CLOSED', color: 'var(--text-dim)', dot: 'var(--text-dim)' };
}

interface TickerItemProps {
  sym: string;
  label: string;
  price: MarketPrice | undefined;
  color: string;
  change: string;
  pct: string;
}

const TickerItem: React.FC<TickerItemProps> = React.memo(({ sym, label, price, color, change, pct }) => {
  const isUp = price ? price.c >= 0 : true;
  const arrowColor = price ? (isUp ? 'var(--pass)' : 'var(--fail)') : 'var(--text-tertiary)';
  return (
    <span className="ticker-item">
      <span className="ticker-symbol">{label}</span>
      {price && (
        <span className="ticker-arrow" style={{ color: arrowColor }}>
          {isUp ? '▲' : '▼'}
        </span>
      )}
      <span className="ticker-price" style={{ color }}>
        {price ? formatPrice(sym, price.p) : '---'}
      </span>
      <span className="ticker-change" style={{ color }}>
        {change}
      </span>
      <span className="ticker-pct" style={{ opacity: 0.8, color }}>
        ({pct})
      </span>
    </span>
  );
});

function TickerRow() {
  const { getPrice } = useMarketStore();
  const market = getMarketStatus();
  const session = getSessionInfo();

  const items = useMemo(
    () =>
      tickerSymbols.map((sym) => {
        const meta = SYMBOLS_DATA.find((e) => e.s === sym);
        const label = meta?.n ?? sym.replace('=F', '').replace('=X', '');
        const price = getPrice(sym);
        const isUp = price ? price.c >= 0 : true;
        const color = price ? (isUp ? 'var(--pass)' : 'var(--fail)') : 'var(--text-tertiary)';
        return { sym, label, price, color, change: formatChange(sym, price?.c), pct: formatPct(price?.pc) };
      }),
    [getPrice],
  );

  const content = items.map((item) => (
    <TickerItem key={item.sym} {...item} />
  ));

  return (
    <div className="ticker-track">
      <div className="ticker-scroll">
        {content}
        {content}
      </div>
    </div>
  );
}

const TickerTape: React.FC = function TickerTape() {
  const market = getMarketStatus();
  const session = getSessionInfo();

  return (
    <div className="ticker-tape">
      <div className="ticker-market-badge" style={{ background: market.dot === 'var(--pass)' ? 'var(--pass-dim)' : 'transparent' }}>
        <span className="ticker-dot" style={{ background: market.dot }} />
        <span className="ticker-market-label" style={{ color: market.color }}>{market.label}</span>
      </div>
      <div className="ticker-session-badge">
        <span className="ticker-session-label" style={{ color: session.active ? 'var(--pass)' : 'var(--text-dim)' }}>{session.label}</span>
      </div>
      <TickerRow />
    </div>
  );
};

export default TickerTape;
