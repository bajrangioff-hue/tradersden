import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Search, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../utils/constants';
import type { LiveNewsItem } from '../../types';

const CATEGORIES = ['all', 'macro', 'forex', 'stocks'] as const;
type Category = typeof CATEGORIES[number];

function timeScore(timeAgo: string): number {
  const num = parseInt(timeAgo);
  if (timeAgo.includes('s')) return num < 300 ? 2 : 1;
  if (timeAgo.includes('m')) return num < 5 ? 2 : num < 30 ? 1 : 0;
  return 0;
}

function dotColor(timeAgo: string): string {
  const s = timeScore(timeAgo);
  if (s === 2) return 'var(--fail)';
  if (s === 1) return 'var(--warning)';
  return 'var(--pass)';
}

const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="p-4 rounded-lg" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]/30" />
          <div className="h-3 w-16 rounded bg-[var(--text-tertiary)]/20" />
          <div className="h-3 w-12 rounded bg-[var(--text-tertiary)]/20" />
        </div>
        <div className="h-4 w-full rounded bg-[var(--text-tertiary)]/20 mb-1" />
        <div className="h-4 w-3/4 rounded bg-[var(--text-tertiary)]/20" />
      </div>
    ))}
  </div>
);

const LiveNewsPanel: React.FC = () => {
  const [articles, setArticles] = useState<LiveNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveNews = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/v1/news/live`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setArticles(json.data?.articles ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setCountdown(30);
    }
  }, []);

  useEffect(() => {
    fetchLiveNews();
    intervalRef.current = setInterval(fetchLiveNews, 30000);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 30));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchLiveNews]);

  const filtered = articles.filter((a) => {
    if (category !== 'all' && a.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      const inTitle = a.title.toLowerCase().includes(q);
      const inSource = a.source.toLowerCase().includes(q);
      if (!inTitle && !inSource) return false;
    }
    return true;
  });

  const sourceCount = new Set(articles.map((a) => a.source)).size;

  return (
    <div className="rounded-xl" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">
              Live News Feed
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--fail)] bg-[var(--fail-dim)] px-1.5 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fail)] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] mono text-[var(--text-tertiary)]">
              {sourceCount} sources · {articles.length} articles
            </span>
            <span className="text-[10px] mono text-[var(--text-tertiary)] flex items-center gap-1">
              <RefreshCw size={11} /> {countdown}s
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wider cursor-pointer transition-all font-sans border-none ${
                    active
                      ? 'text-[var(--text-primary)] bg-[var(--bg-active)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-transparent'
                  }`}
                  onClick={() => setCategory(cat)}
                >
                  {cat === 'all' ? 'ALL' : cat.toUpperCase()}
                </button>
              );
            })}
            <div className="relative flex-1 min-w-[120px] max-w-[200px]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter headlines..."
                className="w-full pl-7 pr-2 py-1.5 text-[11px] font-mono rounded-md bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle size={32} style={{ color: 'var(--fail)' }} />
            <div className="text-sm text-[var(--text-tertiary)]">Feed unavailable - retrying...</div>
            <button
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-[var(--accent)] text-white hover:brightness-110 transition-all cursor-pointer border-none"
              onClick={fetchLiveNews}
            >
              Retry
            </button>
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search size={32} style={{ color: 'var(--text-tertiary)' }} />
            <div className="text-sm text-[var(--text-tertiary)]">No matching articles.</div>
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto space-y-1.5">
            {filtered.map((item, i) => {
              const dot = dotColor(item.time_ago);
              const isRecent = timeScore(item.time_ago) === 2;
              return (
                <motion.a
                  key={`${item.source}-${i}`}
                  href={item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3.5 rounded-lg no-underline transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ background: 'var(--bg-surface)', borderLeft: `3px solid ${dot}` }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                          {item.source}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">·</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{item.time_ago}</span>
                        {isRecent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--fail)] animate-pulse" />
                        )}
                      </div>
                      <div className="text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                          {item.description.replace(/<[^>]+>/g, '').trim()}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={13} className="text-[var(--text-tertiary)] shrink-0 mt-1" />
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveNewsPanel;
