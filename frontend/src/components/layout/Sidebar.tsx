import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, X, Clock } from 'lucide-react';
import { useMarketStore } from '../../hooks/useMarketStore';
import { formatPrice, formatPct } from '../../utils/formatters';

interface WatchlistItem {
  symbol: string;
  grade?: string;
  direction?: string;
}

interface RecentTrade {
  symbol: string;
  direction: string;
  pnl: number;
  timeAgo: string;
}

interface SidebarProps {
  items: WatchlistItem[];
  mobileOpen: boolean;
  onClose: () => void;
  onRemove: (sym: string) => void;
  onClear: () => void;
  onAnalyzeAll: () => void;
  onSelect: (sym: string) => void;
  lastAnalyzed?: { symbol: string; grade: string; time: string } | null;
  selectedSymbol?: string;
  recentTrades?: RecentTrade[];
}

const gradeColors: Record<string, string> = { 'A+': 'var(--grade-aplus)', A: 'var(--grade-a)', B: 'var(--grade-b)', F: 'var(--grade-f)' };

const SidebarContent: React.FC<{
  items: WatchlistItem[];
  onRemove: (sym: string) => void;
  onClear: () => void;
  onAnalyzeAll: () => void;
  onSelect: (sym: string) => void;
  lastAnalyzed?: { symbol: string; grade: string; time: string } | null;
  selectedSymbol?: string;
  recentTrades?: RecentTrade[];
}> = ({ items, onRemove, onClear, onAnalyzeAll, onSelect, lastAnalyzed, selectedSymbol, recentTrades }) => {
  const { getPrice } = useMarketStore();
  const session = (() => {
    const h = new Date().getUTCHours();
    if (h >= 7 && h < 9) return { name: 'LONDON KZ', q: 'PRIME' };
    if (h >= 13 && h < 15) return { name: 'NY KZ', q: 'PRIME' };
    if (h >= 0 && h < 7) return { name: 'ASIA', q: 'NEUTRAL' };
    if (h >= 15 && h < 17) return { name: 'NY AM', q: 'GOOD' };
    if (h >= 17 && h < 19) return { name: 'LUNCH', q: 'AVOID' };
    return { name: 'OFF', q: 'AVOID' };
  })();

  return (
    <div className="flex flex-col h-full">
      {/* Quick Symbols */}
      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-2 gap-1.5">
          {['SPY', 'MNQ=F', 'NQ=F', 'ES=F'].map((s) => (
            <button key={s} onClick={() => onSelect(s)}
              className="text-[10px] font-mono font-semibold px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer border-none"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px" style={{ background: 'var(--bg-border)' }} />

      {/* Watchlist Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-tertiary)' }}>Watchlist</span>
        <div className="flex items-center gap-2">
          <button onClick={onAnalyzeAll} className="text-[9px] font-semibold px-1.5 py-0.5 rounded cursor-pointer border-none transition-all" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            Scan
          </button>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}>{items.length}</span>
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="flex-1 px-4 overflow-y-auto space-y-0.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <TrendingUp size={22} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
            <div className="text-[11px] mt-3" style={{ color: 'var(--text-tertiary)' }}>No symbols pinned</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>Pin from the analysis card</div>
          </div>
        ) : (
          items.map((item) => {
            const gc = gradeColors[item.grade || 'F'] || 'var(--grade-f)';
            const isBullish = item.direction === 'BULLISH';
            const mp = getPrice(item.symbol);
            const isUp = mp ? mp.c >= 0 : true;
            const priceColor = mp ? (isUp ? 'var(--pass)' : 'var(--fail)') : 'var(--text-tertiary)';
            return (
              <div key={item.symbol} onClick={() => onSelect(item.symbol)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-hover)] group"
                style={item.symbol === selectedSymbol ? { background: 'var(--bg-active)' } : {}}
              >
                <span className="flex-1 text-xs font-bold font-mono truncate" style={{ color: 'var(--text-primary)' }}>{item.symbol}</span>
                {mp && (
                  <span className="flex items-center gap-1" style={{ color: priceColor }}>
                    <span className="text-[7px]">{isUp ? '▲' : '▼'}</span>
                    <span className="text-[10px] font-mono font-semibold">{formatPrice(item.symbol, mp.p)}</span>
                  </span>
                )}
                <span className="text-[9px] font-mono" style={{ color: mp ? priceColor : 'var(--text-dim)' }}>
                  {mp ? (mp.pc >= 0 ? '+' : '') + (mp.pc ?? 0).toFixed(2) + '%' : ''}
                </span>
                {item.grade && (
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: `${gc}20`, color: gc }}>{item.grade}</span>
                )}
                <span className="text-[9px]" style={{ color: isBullish ? 'var(--pass)' : 'var(--fail)' }}>{isBullish ? '↑' : '↓'}</span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(item.symbol); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all cursor-pointer bg-transparent border-none"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fail)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <X size={10} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="mx-4 h-px" style={{ background: 'var(--bg-border)' }} />

      {/* Recent Trades */}
      {recentTrades && recentTrades.length > 0 && (
        <>
          <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-tertiary)' }}>Recent Trades</span>
          </div>
          <div className="px-4 pb-2 space-y-1">
            {recentTrades.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{t.symbol}</span>
                  <span className="text-[9px] font-semibold" style={{ color: t.direction === 'LONG' ? 'var(--pass)' : 'var(--fail)' }}>{t.direction}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold font-mono" style={{ color: t.pnl >= 0 ? 'var(--pass)' : 'var(--fail)' }}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </span>
                  <Clock size={10} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[8px]" style={{ color: 'var(--text-tertiary)' }}>{t.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mx-4 h-px" style={{ background: 'var(--bg-border)' }} />
        </>
      )}

      {/* Footer */}
      <div className="px-4 py-3 space-y-2">
        <div>
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Session</div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{session.name}</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${session.q === 'PRIME' ? 'text-[var(--pass)]' : session.q === 'GOOD' ? 'text-[var(--warn)]' : ''}`}
              style={{ background: session.q === 'PRIME' ? 'var(--pass-dim)' : session.q === 'GOOD' ? 'var(--warn-dim)' : 'var(--bg-tertiary)', color: session.q === 'AVOID' ? 'var(--text-tertiary)' : undefined }}>
              {session.q}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={onClear} className="flex-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all cursor-pointer border-none"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-active)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          >Clear</button>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ items, mobileOpen, onClose, onRemove, onClear, onAnalyzeAll, onSelect, lastAnalyzed, selectedSymbol, recentTrades }) => (
  <>
    <aside className="hidden lg:block w-[260px] shrink-0 overflow-y-auto" style={{ background: 'var(--bg-app)', borderRight: '1px solid rgba(42,42,46,0.8)', height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}>
      <SidebarContent items={items} onRemove={onRemove} onClear={onClear} onAnalyzeAll={onAnalyzeAll} onSelect={onSelect} lastAnalyzed={lastAnalyzed} selectedSymbol={selectedSymbol} recentTrades={recentTrades} />
    </aside>
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="fixed left-0 top-0 bottom-0 z-50 w-[300px] max-w-[80vw] lg:hidden" style={{ background: 'var(--bg-app)', borderRight: 'var(--border-subtle)' }}
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: 'var(--text-tertiary)' }}>Watchlist</span>
              <button className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none" onClick={onClose}><X size={16} /></button>
            </div>
            <SidebarContent items={items} onRemove={onRemove} onClear={onClear} onAnalyzeAll={onAnalyzeAll} onSelect={onSelect} lastAnalyzed={lastAnalyzed} selectedSymbol={selectedSymbol} recentTrades={recentTrades} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
);

export default Sidebar;
