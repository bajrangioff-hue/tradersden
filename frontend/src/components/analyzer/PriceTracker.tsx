import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceData {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number | null;
  avgVolume: number | null;
}

interface PriceTrackerProps {
  symbol: string;
}

const PriceTracker: React.FC<PriceTrackerProps> = ({ symbol }) => {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const resp = await fetch(`/api/v1/market/price/${encodeURIComponent(symbol)}`);
        if (resp.ok) {
          const json = await resp.json();
          setData({
            price: json.price ?? json.p,
            change: json.change ?? json.c,
            changePct: json.change_pct ?? json.pc,
            high: json.high ?? json.h,
            low: json.low ?? json.l,
            volume: json.volume ?? json.v ?? null,
            avgVolume: json.avg_volume ?? null,
          });
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <div className="h-4 w-16 rounded mb-2" style={{ background: 'var(--bg-hover)' }} />
        <div className="h-8 w-24 rounded mb-2" style={{ background: 'var(--bg-hover)' }} />
        <div className="h-3 w-32 rounded" style={{ background: 'var(--bg-hover)' }} />
      </div>
    );
  }

  const isUp = (data?.change ?? 0) >= 0;
  const color = isUp ? 'var(--pass)' : 'var(--fail)';

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Live Price</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--pass)]" style={{ boxShadow: '0 0 4px var(--pass)' }} />
          <span className="text-[10px] font-semibold text-[var(--pass)]">LIVE</span>
        </span>
      </div>

      {data?.price != null ? (
        <>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              ${data.price.toFixed(2)}
            </span>
            <span className="text-sm font-semibold font-mono" style={{ color }}>
              {isUp ? '+' : ''}{data.change?.toFixed(2) ?? '0.00'} ({isUp ? '+' : ''}{data.changePct?.toFixed(2) ?? '0.00'}%)
            </span>
            <span style={{ color }}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Day Range</span>
              <div className="font-mono font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                ${data.low?.toFixed(2) ?? '—'} — ${data.high?.toFixed(2) ?? '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Volume</span>
              <div className="font-mono font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {data.volume ? `${(data.volume / 1_000_000).toFixed(1)}M` : '—'}
                {data.avgVolume != null && <span className="text-[var(--text-tertiary)] ml-1">/ {(data.avgVolume / 1_000_000).toFixed(1)}M avg</span>}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>
          Price data unavailable
        </div>
      )}
    </div>
  );
};

export default PriceTracker;
