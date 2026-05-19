import React, { useState, useEffect, useCallback } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { listLevels, updateLevel, deleteLevel } from '../lib/api';
import type { ConfluenceLevel } from '../types';

const LEVEL_TYPE_COLORS: Record<string, string> = {
  ORDER_BLOCK: '#2D7FF9',
  FVG: '#22C55E',
  BSL: '#F59E0B',
  SSL: '#EF4444',
  EQUAL_HIGHS: '#A855F7',
  EQUAL_LOWS: '#A855F7',
  LIQUIDITY: '#F59E0B',
  DOL: '#EC4899',
  OTE: '#0EA5E9',
  BREAKER: '#F97316',
  INDUCEMENT: '#14B8A6',
};

const LevelsPage: React.FC = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [levels, setLevels] = useState<ConfluenceLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMitigated, setFilterMitigated] = useState<string>('all');

  const fetchLevels = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    try {
      const mitigated = filterMitigated === 'all' ? undefined : filterMitigated === 'mitigated';
      const result = await listLevels(symbol.toUpperCase(), undefined, mitigated);
      setLevels(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load levels');
    } finally {
      setLoading(false);
    }
  }, [symbol, filterMitigated]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleToggleFavorite = async (level: ConfluenceLevel) => {
    if (!level.id) return;
    try {
      const updated = await updateLevel(level.id, { is_favorite: !level.is_favorite });
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleToggleMitigated = async (level: ConfluenceLevel) => {
    if (!level.id) return;
    try {
      const updated = await updateLevel(level.id, { is_mitigated: !level.is_mitigated });
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLevel(id);
      setLevels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div className="card-surface p-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && fetchLevels()}
          className="w-24 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] uppercase"
          placeholder="SPY"
        />
        <select
          value={filterMitigated}
          onChange={(e) => setFilterMitigated(e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Levels</option>
          <option value="unmitigated">Unmitigated Only</option>
          <option value="mitigated">Mitigated Only</option>
        </select>
        <button
          onClick={fetchLevels}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-xs text-[var(--fail)] bg-[var(--fail-dim)] rounded-lg px-4 py-2">{error}</div>
      )}

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--bg-border)] text-[var(--text-tertiary)]">
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-right px-3 py-2 font-medium">Price</th>
              <th className="text-center px-3 py-2 font-medium">Direction</th>
              <th className="text-center px-3 py-2 font-medium">Score</th>
              <th className="text-center px-3 py-2 font-medium">Strength</th>
              <th className="text-center px-3 py-2 font-medium">TF</th>
              <th className="text-center px-3 py-2 font-medium">Mitigated</th>
              <th className="text-right px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => (
              <tr key={level.id} className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-hover)]">
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{
                    color: LEVEL_TYPE_COLORS[level.level_type] || '#71717A',
                    background: `${LEVEL_TYPE_COLORS[level.level_type] || '#71717A'}15`,
                  }}>
                    {level.level_type}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--text-primary)] font-semibold">
                  ${level.price.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center">
                  {level.direction && (
                    <span className={`text-[10px] font-medium ${
                      level.direction === 'bullish' || level.direction === 'BULLISH'
                        ? 'text-[var(--pass)]' : 'text-[var(--fail)]'
                    }`}>
                      {level.direction.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center font-mono font-semibold" style={{ color: scoreColor(level.confluence_score) }}>
                  {level.confluence_score.toFixed(0)}
                </td>
                <td className="px-3 py-2 text-center text-[var(--text-dim)] capitalize">{level.strength}</td>
                <td className="px-3 py-2 text-center text-[var(--text-dim)]">{level.time_frame}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleToggleMitigated(level)}
                    className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer border-none ${
                      level.is_mitigated ? 'text-[var(--fail)] bg-[var(--fail-dim)]' : 'text-[var(--pass)] bg-[var(--pass-dim)]'
                    }`}
                  >
                    {level.is_mitigated ? 'Yes' : 'No'}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggleFavorite(level)}
                      className={`p-1 rounded cursor-pointer border-none ${
                        level.is_favorite ? 'text-[#F59E0B]' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
                      }`}
                      title="Toggle favorite"
                    >
                      <Star size={13} fill={level.is_favorite ? '#F59E0B' : 'none'} />
                    </button>
                    {level.id && (
                      <button
                        onClick={() => handleDelete(level.id!)}
                        className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--fail)] cursor-pointer border-none"
                        title="Delete level"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {levels.length === 0 && !loading && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--text-dim)] text-xs">No saved levels</td></tr>
            )}
            {loading && (
              <tr><td colSpan={8} className="px-3 py-8 text-center shimmer text-[var(--text-dim)] text-xs">Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LevelsPage;
