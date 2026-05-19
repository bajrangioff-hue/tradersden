import React from 'react';
import { X, Edit3, Trash2, Copy, Image as ImageIcon } from 'lucide-react';
import type { TradeOut } from '../../types';
import ScreenshotUpload from './ScreenshotUpload';

interface TradeDetailCardProps {
  trade: TradeOut;
  onClose: () => void;
  onEdit: (trade: TradeOut) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (trade: TradeOut) => void;
}

const TradeDetailCard: React.FC<TradeDetailCardProps> = ({ trade, onClose, onEdit, onDelete, onDuplicate }) => {
  const pnl = trade.pnl ?? 0;
  const isProfit = pnl >= 0;
  const risk = trade.stop_loss ? Math.abs(trade.entry_price - trade.stop_loss) * trade.quantity : null;
  const reward = trade.exit_price ? Math.abs(trade.exit_price - trade.entry_price) * trade.quantity : null;
  const rr = risk && reward && risk > 0 ? (reward / risk).toFixed(2) : null;
  const roi = trade.exit_price && trade.entry_price ? Math.abs((trade.exit_price - trade.entry_price) / trade.entry_price) * 100 : null;

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
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold font-mono" style={{ color: 'var(--accent)' }}>{trade.symbol}</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${trade.direction === 'LONG' ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`} style={{ background: trade.direction === 'LONG' ? 'var(--pass-dim)' : 'var(--fail-dim)' }}>
              {trade.direction}
            </span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isProfit ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`} style={{ background: isProfit ? 'var(--pass-dim)' : 'var(--fail-dim)' }}>
              {isProfit ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(trade)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] cursor-pointer bg-transparent border-none transition-colors" title="Edit">
              <Edit3 size={14} />
            </button>
            {onDuplicate && (
              <button onClick={() => onDuplicate(trade)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer bg-transparent border-none transition-colors" title="Duplicate">
                <Copy size={14} />
              </button>
            )}
            <button onClick={() => onDelete(trade.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--fail)] hover:bg-[var(--bg-hover)] cursor-pointer bg-transparent border-none transition-colors" title="Delete">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer bg-transparent border-none transition-colors" title="Close">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Date & Time */}
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {new Date(trade.entry_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            <span className="mx-2" style={{ color: 'var(--text-tertiary)' }}>·</span>
            {new Date(trade.entry_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {trade.exit_time && (
              <>
                <span className="mx-2" style={{ color: 'var(--text-tertiary)' }}>→</span>
                {new Date(trade.exit_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </>
            )}
          </div>

          {/* Entry / Exit / Result */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Entry</span>
              <div className="mt-2">
                <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>${trade.entry_price.toFixed(2)}</div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>Qty: {trade.quantity}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{new Date(trade.entry_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Exit</span>
              <div className="mt-2">
                <div className="text-xl font-bold font-mono" style={{ color: trade.exit_price ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '—'}
                </div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>Qty: {trade.quantity}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {trade.exit_time ? new Date(trade.exit_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Result</span>
              <div className="mt-2">
                <div className={`text-xl font-bold font-mono ${isProfit ? 'text-[var(--pass)]' : 'text-[var(--fail)]'}`}>
                  {isProfit ? '+' : ''}${pnl.toFixed(2)}
                </div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {trade.outcome ?? 'OPEN'}
                </div>
                {roi && <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>ROI: {roi.toFixed(2)}%</div>}
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          {risk != null && reward != null && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Risk Analysis</span>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Risk per Trade</span>
                  <div className="text-sm font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>${risk.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Reward per Trade</span>
                  <div className="text-sm font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>${reward.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Risk/Reward</span>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${parseFloat(rr ?? '0') >= 2 ? 'text-[var(--pass)]' : parseFloat(rr ?? '0') >= 1 ? 'text-[var(--warn)]' : 'text-[var(--fail)]'}`}>
                    {rr ? `1:${rr}` : '—'} {rr && parseFloat(rr) >= 2 ? '✓' : ''}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs" style={{ color: parseFloat(rr ?? '0') >= 2 ? 'var(--pass)' : parseFloat(rr ?? '0') >= 1 ? 'var(--warn)' : 'var(--fail)' }}>
                {rr && parseFloat(rr) >= 2 ? 'FAVORABLE' : rr && parseFloat(rr) >= 1 ? 'ACCEPTABLE' : 'UNFAVORABLE'}
              </div>
            </div>
          )}

          {/* Setup Details */}
          {trade.grade_at_entry && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Setup Details</span>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {trade.session && <div><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Session</span><div className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{trade.session}</div></div>}
                {trade.grade_at_entry && <div><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Grade at Entry</span><div className="text-sm font-medium mt-0.5 font-mono" style={{ color: 'var(--accent)' }}>{trade.grade_at_entry}</div></div>}
                {trade.stop_loss && <div><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Stop Loss</span><div className="text-sm font-medium mt-0.5 font-mono" style={{ color: 'var(--fail)' }}>${trade.stop_loss.toFixed(2)}</div></div>}
                {trade.take_profit && <div><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Take Profit</span><div className="text-sm font-medium mt-0.5 font-mono" style={{ color: 'var(--pass)' }}>${trade.take_profit.toFixed(2)}</div></div>}
              </div>
            </div>
          )}

          {/* Trade Notes */}
          {trade.notes && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Trade Notes & Analysis</span>
              <div className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{trade.notes}</div>
            </div>
          )}

          {/* Screenshot */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Screenshot</span>
            </div>
            <ScreenshotUpload tradeId={trade.id} />
          </div>

          {/* Tags */}
          {trade.setup_tags && trade.setup_tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Tags</span>
              {trade.setup_tags.map((tag) => (
                <span key={tag} className="text-[11px] font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--bg-border)' }}>
            <button onClick={() => onEdit(trade)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all" style={{ background: 'var(--accent)', color: '#000' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >Edit Trade</button>
            <button onClick={() => onDelete(trade.id)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all" style={{ background: 'var(--fail-dim)', color: 'var(--fail)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,92,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--fail-dim)'; }}
            >Delete Trade</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailCard;
