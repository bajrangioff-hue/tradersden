import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { createTrade, updateTrade } from '../../lib/api';
import type { TradeOut } from '../../types';

interface TradeFormProps {
  onSaved: () => void;
  onCancel: () => void;
  editTrade?: TradeOut | null;
}

const SESSION_OPTIONS = ['London', 'NY AM', 'NY PM', 'Asia'];
const SETUP_OPTIONS = ['ICT OTE', 'FVG Fill', 'Breaker Block', 'Liquidity Sweep', 'CISD', 'Order Block'];

const TradeForm: React.FC<TradeFormProps> = ({ onSaved, onCancel, editTrade }) => {
  const [symbol, setSymbol] = useState(editTrade?.symbol ?? '');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>((editTrade?.direction as 'LONG' | 'SHORT') ?? 'LONG');
  const [entryPrice, setEntryPrice] = useState(editTrade?.entry_price?.toString() ?? '');
  const [exitPrice, setExitPrice] = useState(editTrade?.exit_price?.toString() ?? '');
  const [quantity, setQuantity] = useState(editTrade?.quantity?.toString() ?? '');
  const [session, setSession] = useState(editTrade?.session ?? '');
  const [setup, setSetup] = useState('');
  const [rValue, setRValue] = useState('');
  const [notes, setNotes] = useState(editTrade?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onCancel])

  useEffect(() => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || 0;
    if (entry > 0 && exit > 0) {
      const rr = Math.abs(exit - entry) / entry;
      setRValue(rr.toFixed(2));
    } else {
      setRValue('');
    }
  }, [entryPrice, exitPrice]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError('');
    const newErrors: Record<string, string> = {};
    if (!symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!entryPrice) newErrors.entryPrice = 'Entry price is required';
    if (!quantity) newErrors.quantity = 'Size is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSaving(true);
    try {
      const innerEntry = parseFloat(entryPrice) || 0;
      const innerQty = parseInt(quantity) || 0;
      if (isEditing && editTrade) {
        await updateTrade(editTrade.id, {
          exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
          notes: notes || undefined,
        });
      } else {
        await createTrade({
          symbol: symbol.toUpperCase(),
          direction,
          entry_price: innerEntry,
          quantity: innerQty,
          entry_time: new Date().toISOString(),
          exit_price: exitPrice ? parseFloat(exitPrice) || 0 : undefined,
          session: session || undefined,
          setup_tags: setup ? [setup] : undefined,
          notes: notes || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!editTrade;

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.50)' }}>
      <div
        className="bg-white rounded-2xl overflow-y-auto"
        style={{
          padding: 32,
          width: 580,
          maxHeight: '90vh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
        }}
      >
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl font-bold text-[#1A202C]">{isEditing ? 'Edit Trade' : 'Log New Trade'}</h2>
          <button onClick={onCancel} className="p-0 bg-transparent border-none cursor-pointer text-[#9CA3AF] hover:text-[#374151] transition-colors duration-150">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] mb-4">Trade Details</div>

          <div className="grid grid-cols-2 gap-5">
            {/* Symbol - full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Symbol</label>
              <input
                required value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. ES, NQ, CL"
                style={{
                  width: '100%', height: 40, border: `1px solid ${errors.symbol ? '#E17055' : '#EEF0F3'}`, borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              />
              {errors.symbol && <div className="text-[11px] mt-1" style={{ color: '#E17055' }}>{errors.symbol}</div>}
            </div>

            {/* Direction */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Direction</label>
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setDirection('LONG')}
                  style={{
                    flex: 1, padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 150ms',
                    background: direction === 'LONG' ? '#DCFCE7' : '#FFFFFF',
                    color: direction === 'LONG' ? '#16A34A' : '#9CA3AF',
                    border: direction === 'LONG' ? '1px solid #16A34A' : '1px solid #EEF0F3',
                  }}
                >Long</button>
                <button
                  type="button" onClick={() => setDirection('SHORT')}
                  style={{
                    flex: 1, padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 150ms',
                    background: direction === 'SHORT' ? '#FEE2E2' : '#FFFFFF',
                    color: direction === 'SHORT' ? '#DC2626' : '#9CA3AF',
                    border: direction === 'SHORT' ? '1px solid #DC2626' : '1px solid #EEF0F3',
                  }}
                >Short</button>
              </div>
            </div>

            {/* Session */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Session</label>
              <select value={session} onChange={(e) => setSession(e.target.value)}
                style={{
                  width: '100%', height: 40, border: '1px solid #EEF0F3', borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              >
                <option value="">Select session</option>
                {SESSION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Entry Price</label>
              <input
                required type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="420.50"
                style={{
                  width: '100%', height: 40, border: `1px solid ${errors.entryPrice ? '#E17055' : '#EEF0F3'}`, borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              />
              {errors.entryPrice && <div className="text-[11px] mt-1" style={{ color: '#E17055' }}>{errors.entryPrice}</div>}
            </div>

            {/* Exit Price */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Exit Price</label>
              <input
                type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)}
                placeholder="425.00"
                style={{
                  width: '100%', height: 40, border: '1px solid #EEF0F3', borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              />
            </div>

            {/* Size */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Size</label>
              <input
                required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                style={{
                  width: '100%', height: 40, border: `1px solid ${errors.quantity ? '#E17055' : '#EEF0F3'}`, borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              />
              {errors.quantity && <div className="text-[11px] mt-1" style={{ color: '#E17055' }}>{errors.quantity}</div>}
            </div>

            {/* Setup */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Setup</label>
              <select value={setup} onChange={(e) => setSetup(e.target.value)}
                style={{
                  width: '100%', height: 40, border: '1px solid #EEF0F3', borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              >
                <option value="">Select setup</option>
                {SETUP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* R Value */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">R Value</label>
              <input
                value={rValue} onChange={(e) => setRValue(e.target.value)}
                placeholder="e.g. 2.5"
                style={{
                  width: '100%', height: 40, border: '1px solid #EEF0F3', borderRadius: 8,
                  padding: '0 12px', fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                  outline: 'none', transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              />
              <div className="text-[11px] text-[#9CA3AF]" style={{ marginTop: 4 }}>Auto-calculated if entry/exit/size filled</div>
            </div>
          </div>

          {/* Notes - full width */}
          <div style={{ marginTop: 20 }}>
            <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] mb-[6px]">Notes</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
              placeholder="Add notes about this trade..."
              style={{
                width: '100%', height: 80, border: '1px solid #EEF0F3', borderRadius: 8,
                padding: 12, fontSize: 13, color: '#1A202C', background: '#FFFFFF',
                outline: 'none', resize: 'none', transition: 'border-color 150ms',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
            />
          </div>

          {error && (
            <div className="text-[13px] rounded-lg px-4 py-2.5" style={{ color: '#E17055', background: 'rgba(225,112,85,0.10)', marginTop: 16 }}>{error}</div>
          )}

          <div style={{ borderTop: '1px solid #EEF0F3', margin: '24px 0' }} />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel}
              style={{
                height: 40, padding: '0 20px', border: '1px solid #EEF0F3', borderRadius: 8,
                background: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'background 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            >Cancel</button>
            <button type="submit" disabled={saving}
              style={{
                height: 40, padding: '0 24px', border: 'none', borderRadius: 8,
                background: saving ? '#8B7FE0' : '#6C5CE7', color: '#FFFFFF',
                fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#5B4BD4'; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = '#6C5CE7'; }}
            >{saving ? 'Saving...' : isEditing ? 'Update Trade' : 'Save Trade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
