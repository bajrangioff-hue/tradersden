import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { listSetups, deleteSetup, getSetup } from '../lib/api';
import type { SetupOut } from '../types';

const SetupsPage: React.FC = () => {
  const [setups, setSetups] = useState<SetupOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSnapshot, setExpandedSnapshot] = useState<Record<string, unknown> | null>(null);

  const fetchSetups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listSetups();
      setSetups(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load setups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSetups();
  }, [fetchSetups]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSetup(id);
      setSetups((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedSnapshot(null);
      return;
    }
    try {
      const setup = await getSetup(id);
      setExpandedId(id);
      setExpandedSnapshot(setup.analysis_snapshot);
    } catch {
      setExpandedId(null);
      setExpandedSnapshot(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Saved Setups</h2>
        <button
          onClick={fetchSetups}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer bg-[#6C5CE7] text-white"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-xs text-[#E17055] bg-[#FEF2F2] rounded-lg px-4 py-2">{error}</div>
      )}

      <div className="space-y-2">
        {setups.map((setup) => (
          <div key={setup.id} className="bg-white border border-[#EEF0F3] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => handleExpand(setup.id)}>
              <div className="flex items-center gap-3">
                <button className="text-[#9CA3AF] cursor-pointer border-none">
                  {expandedId === setup.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div>
                  <span className="text-sm font-semibold text-[#1A202C]">{setup.symbol}</span>
                  {setup.title && (
                    <span className="ml-2 text-xs text-[#6B7280]">{setup.title}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#9CA3AF]">{formatDate(setup.created_at)}</span>
                <span className="text-[10px] text-[#9CA3AF]">{setup.level_ids.length} levels</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(setup.id); }}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#E17055] cursor-pointer border-none"
                  title="Delete setup"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {expandedId === setup.id && expandedSnapshot && (
              <div className="px-4 pb-3 pt-0 border-t border-[#EEF0F3]">
                <pre className="text-[10px] text-[#6B7280] font-mono whitespace-pre-wrap overflow-x-auto max-h-48 mt-2">
                  {JSON.stringify(expandedSnapshot, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
        {setups.length === 0 && !loading && (
          <div className="text-xs text-[#9CA3AF] text-center py-8">No saved setups</div>
        )}
        {loading && (
          <div className="text-xs text-[#9CA3AF] text-center py-8 shimmer rounded">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default SetupsPage;
