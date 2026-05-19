import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Star, Settings, Share2, TrendingUp } from 'lucide-react';

interface QuickActionsProps {
  symbol: string;
  onLogTrade: () => void;
  onAddToWatchlist?: () => void;
  isPinned?: boolean;
}

const actionBtn = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all duration-200";

const QuickActions: React.FC<QuickActionsProps> = ({ symbol, onLogTrade, onAddToWatchlist, isPinned }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
      <span className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-tertiary)' }}>Quick Actions</span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onLogTrade}
          className={actionBtn}
          style={{ background: 'var(--accent)', color: '#000' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          <Plus size={14} />
          Log Trade
        </button>
        <button
          onClick={() => navigate('/journal')}
          className={actionBtn}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <BookOpen size={14} />
          View Journal
        </button>
        {onAddToWatchlist && (
          <button
            onClick={onAddToWatchlist}
            className={actionBtn}
            style={{ background: isPinned ? 'var(--accent-dim)' : 'var(--bg-elevated)', color: isPinned ? 'var(--accent)' : 'var(--text-secondary)', border: isPinned ? 'var(--border-accent)' : 'var(--border-subtle)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isPinned ? 'var(--accent-dim)' : 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isPinned ? 'var(--accent-dim)' : 'var(--bg-elevated)'; }}
          >
            <Star size={14} fill={isPinned ? 'currentColor' : 'none'} />
            {isPinned ? 'Pinned' : 'Watchlist'}
          </button>
        )}
        <button
          onClick={() => navigate('/statistics')}
          className={actionBtn}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <TrendingUp size={14} />
          Statistics
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
