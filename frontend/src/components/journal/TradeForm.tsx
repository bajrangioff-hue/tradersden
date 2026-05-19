import React, { useState, useMemo } from 'react';
import { X, Upload } from 'lucide-react';
import { createTrade, updateTrade } from '../../lib/api';
import type { TradeOut } from '../../types';

interface TradeFormProps {
  onSaved: () => void;
  onCancel: () => void;
  editTrade?: TradeOut | null;
}

const SESSION_OPTIONS = ['', 'London', 'NY', 'Asia', 'Pre-Market', 'Post-Market'];

const CONFLUENCE_FACTORS = [
  { key: 'market_structure', label: 'Market Structure' },
  { key: 'order_block', label: 'Order Block' },
  { key: 'fvg', label: 'FVG' },
  { key: 'liquidity_sweep', label: 'Liquidity Sweep' },
  { key: 'killzone', label: 'Kill Zone' },
  { key: 'premium_discount', label: 'Premium / Discount' },
  { key: 'ote', label: 'OTE' },
  { key: 'narrative', label: 'Narrative' },
];

const TradeForm: React.FC<TradeFormProps> = ({ onSaved, onCancel, editTrade }) => {
  const [symbol, setSymbol] = useState(editTrade?.symbol ?? 'SPY');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>((editTrade?.direction as 'LONG' | 'SHORT') ?? 'LONG');
  const [entryPrice, setEntryPrice] = useState(editTrade?.entry_price?.toString() ?? '');
  const [exitPrice, setExitPrice] = useState(editTrade?.exit_price?.toString() ?? '');
  const [quantity, setQuantity] = useState(editTrade?.quantity?.toString() ?? '1');
  const [stopLoss, setStopLoss] = useState(editTrade?.stop_loss?.toString() ?? '');
  const [takeProfit, setTakeProfit] = useState(editTrade?.take_profit?.toString() ?? '');
  const [session, setSession] = useState(editTrade?.session ?? '');
  const [tagsInput, setTagsInput] = useState(editTrade?.setup_tags?.join(', ') ?? '');
  const [notes, setNotes] = useState(editTrade?.notes ?? '');
  const [strategy, setStrategy] = useState('');
  const [confluenceFactors, setConfluenceFactors] = useState<string[]>([]);
  const [confidence, setConfidence] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editTrade;

  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const qty = parseInt(quantity) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;

  const autoReward = entry > 0 && exit > 0 && qty > 0 ? Math.abs(exit - entry) * qty : null;
  const autoRisk = entry > 0 && sl > 0 && qty > 0 ? Math.abs(entry - sl) * qty : null;
  const autoRR = autoRisk && autoReward && autoRisk > 0 ? (autoReward / autoRisk).toFixed(2) : null;
  const autoROI = entry > 0 && exit > 0 ? Math.abs((exit - entry) / entry) * 100 : null;

  const toggleFactor = (key: string) => {
    setConfluenceFactors((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const strategyTags = strategy ? [strategy, ...confluenceFactors] : confluenceFactors;
      const allTags = [...new Set([...tags, ...strategyTags])];

      const body: Record<string, unknown> = {
        symbol: symbol.toUpperCase(),
        direction,
        entry_price: entry,
        quantity: qty,
        entry_time: editTrade?.entry_time ?? new Date().toISOString(),
        setup_tags: allTags,
      };

      if (exitPrice) body.exit_price = exit;
      if (session) body.session = session;
      if (notes) body.notes = notes;
      if (stopLoss) body.stop_loss = sl;
      if (takeProfit) body.take_profit = tp;
      if (editTrade?.commission) body.commission = editTrade.commission;

      if (isEditing) {
        await updateTrade(editTrade.id, body as Parameters<typeof updateTrade>[1]);
      } else {
        await createTrade(body as Parameters<typeof createTrade>[0]);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'var(--bg-surface)',
          border: 'var(--border-subtle)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{isEditing ? 'Edit Trade' : 'Log a New Trade'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer bg-transparent border-none transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic Info */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-tertiary)' }}>Basic Info</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Symbol</label>
                <input required value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Direction</label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setDirection('LONG')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border-none transition-all ${direction === 'LONG' ? 'text-[var(--pass)]' : 'text-[var(--text-tertiary)]'}`}
                    style={{ background: direction === 'LONG' ? 'var(--pass-dim)' : 'var(--bg-tertiary)' }}
                  >LONG</button>
                  <button type="button" onClick={() => setDirection('SHORT')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border-none transition-all ${direction === 'SHORT' ? 'text-[var(--fail)]' : 'text-[var(--text-tertiary)]'}`}
                    style={{ background: direction === 'SHORT' ? 'var(--fail-dim)' : 'var(--bg-tertiary)' }}
                  >SHORT</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Session</label>
                <select value={session} onChange={(e) => setSession(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-[var(--text-primary)] outline-none transition-all"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  {SESSION_OPTIONS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-tertiary)' }}>{s || 'Any'}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Entry / Exit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-tertiary)' }}>Entry</span>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Price</label>
                  <input required type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                    placeholder="420.50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Size</label>
                  <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Stop Loss</label>
                  <input type="number" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                    placeholder="419.00"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-tertiary)' }}>Exit</span>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Price</label>
                  <input type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                    placeholder="425.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Take Profit</label>
                  <input type="number" step="0.01" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                    placeholder="428.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Fields */}
          {(autoReward || autoRisk || autoROI) && (
            <div className="rounded-xl p-4" style={{ background: 'var(--accent-dim-2)', border: 'var(--border-accent)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--accent)' }}>Calculated Fields</span>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {autoReward != null && (
                  <div>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Reward</span>
                    <div className="text-sm font-bold font-mono mt-0.5 text-[var(--pass)]">${autoReward.toFixed(2)}</div>
                  </div>
                )}
                {autoRR && (
                  <div>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Risk/Reward</span>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${parseFloat(autoRR) >= 2 ? 'text-[var(--pass)]' : parseFloat(autoRR) >= 1 ? 'text-[var(--warn)]' : 'text-[var(--fail)]'}`}>
                      1:{autoRR} {parseFloat(autoRR) >= 2 ? '✓' : ''}
                    </div>
                  </div>
                )}
                {autoROI && (
                  <div>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>ROI</span>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${autoROI >= 0 ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
                      {autoROI >= 0 ? '+' : ''}{autoROI.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Setup Details */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-tertiary)' }}>Setup Details</span>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Strategy</label>
                <input value={strategy} onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                  placeholder="e.g. Pullback to Support, Breakout, etc."
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Confluence Factors</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {CONFLUENCE_FACTORS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggleFactor(f.key)}
                      className={`text-[10px] font-medium px-3 py-2 rounded-lg cursor-pointer border-none transition-all ${
                        confluenceFactors.includes(f.key) ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                      }`}
                      style={{ background: confluenceFactors.includes(f.key) ? 'var(--accent-dim)' : 'var(--bg-tertiary)' }}
                    >
                      {confluenceFactors.includes(f.key) ? '✓ ' : ''}{f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Confidence (%)</label>
                <input type="number" min="0" max="100" value={confidence} onChange={(e) => setConfidence(e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                  placeholder="92"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Analysis & Notes</span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{notes.length}/5000</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 5000))}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all resize-none leading-relaxed"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              placeholder="Write your analysis here. What was the setup? What went right? What went wrong? Any lessons learned?"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Tags</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ICT, FVG, Order Block, ..."
              className="w-full px-3 py-2 rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
            />
          </div>

          {error && <div className="text-xs rounded-lg px-4 py-2" style={{ color: 'var(--fail)', background: 'var(--fail-dim)' }}>{error}</div>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none transition-all"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 border-none transition-all"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              {saving ? 'Saving...' : isEditing ? 'Update Trade' : 'Save Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
