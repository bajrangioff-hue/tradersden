import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { SYMBOLS_DATA } from '../../utils/constants';

interface SymbolPillsProps {
  activeTab: string;
  selectedSymbol: string;
  onSelect: (sym: string) => void;
}

const SymbolPills: React.FC<SymbolPillsProps> = ({ activeTab, selectedSymbol, onSelect }) => {
  const [filterText, setFilterText] = useState('');
  if (activeTab === 'all') return null;

  const baseSymbols = SYMBOLS_DATA.filter((s) => s.cats.includes(activeTab));
  const symbols = useMemo(() => {
    if (!filterText.trim()) return baseSymbols;
    const q = filterText.toUpperCase();
    return baseSymbols.filter((s) => s.s.toUpperCase().includes(q) || s.n.toUpperCase().includes(q));
  }, [baseSymbols, filterText]);
  if (!baseSymbols.length) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-5 pb-2">
      <div className="relative mb-2">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder={`Filter ${activeTab.toUpperCase()} symbols...`}
          className="w-full max-w-[280px] bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg pl-7 pr-7 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent-dim)] font-mono"
        />
        {filterText && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none p-0.5" onClick={() => setFilterText('')}>
            <X size={11} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {symbols.length === 0 ? (
          <div className="text-[12px] text-[var(--text-dim)] py-2">No symbols match &quot;{filterText}&quot;</div>
        ) : (
          symbols.map((sym, i) => (
            <motion.button
              key={sym.s}
              className={`px-3 py-1.5 rounded-lg text-left transition-all cursor-pointer border font-sans card-hover ${
                selectedSymbol === sym.s
                  ? 'bg-[var(--accent-dim)] border-[var(--accent-border)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--bg-border)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent-border)]'
              }`}
              onClick={() => onSelect(sym.s)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.15 }}
            >
              <div className={`text-xs font-bold mono ${selectedSymbol === sym.s ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                {sym.s}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{sym.n}</div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default SymbolPills;
