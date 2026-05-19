import React from 'react';
import { CATEGORIES, CAT_LABELS } from '../../utils/constants';

interface TabBarProps {
  active: string;
  onSelect: (tab: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ active, onSelect }) => (
  <div className="max-w-[1200px] mx-auto px-4 lg:px-5 pt-3 pb-2 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
    {CATEGORIES.map((cid, i) => (
      <React.Fragment key={cid}>
        {i === 6 && <div className="w-px h-4 mx-2 shrink-0 bg-[var(--bg-border)]" />}
        <button
          className={`px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border-none ${
            active === cid
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
          style={{
            borderRadius: '6px',
            background: active === cid ? 'var(--bg-active)' : 'transparent',
          }}
          onClick={() => onSelect(cid)}
        >
          {CAT_LABELS[cid]}
        </button>
      </React.Fragment>
    ))}
  </div>
);

export default TabBar;
