import React, { useEffect, useRef } from 'react';
import { X, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import type { TradeOut } from '../../types';
import ScreenshotUpload from './ScreenshotUpload';

interface TradeDetailCardProps {
  trade: TradeOut;
  onClose: () => void;
  onEdit: (trade: TradeOut) => void;
  onDelete: (id: string) => void;
}

const TradeDetailCard: React.FC<TradeDetailCardProps> = ({ trade, onClose, onEdit, onDelete }) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  const pnl = trade.pnl ?? 0;
  const isProfit = pnl >= 0;
  const risk = trade.stop_loss ? Math.abs(trade.entry_price - trade.stop_loss) * trade.quantity : null;
  const reward = trade.exit_price ? Math.abs(trade.exit_price - trade.entry_price) * trade.quantity : null;
  const rr = risk && reward && risk > 0 ? (reward / risk).toFixed(2) : null;
  const roi = trade.exit_price && trade.entry_price ? Math.abs((trade.exit_price - trade.entry_price) / trade.entry_price) * 100 : null;

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose() }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.40)' }}>
      <div className="w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-[#6C5CE7]">{trade.symbol}</span>
            <span className="text-[10px] font-semibold px-[10px] py-[3px]" style={{
              borderRadius: 20,
              color: trade.direction === 'LONG' ? '#16A34A' : '#DC2626',
              background: trade.direction === 'LONG' ? '#DCFCE7' : '#FEE2E2',
            }}>
              {trade.direction === 'LONG' ? 'Long' : 'Short'}
            </span>
            {trade.outcome && (
              <span className="text-[10px] font-semibold px-[10px] py-[3px]" style={{
                borderRadius: 20,
                color: trade.outcome === 'WIN' ? '#16A34A' : trade.outcome === 'LOSS' ? '#DC2626' : '#6B7280',
                background: trade.outcome === 'WIN' ? '#DCFCE7' : trade.outcome === 'LOSS' ? '#FEE2E2' : '#F3F4F6',
              }}>
                {trade.outcome === 'BREAK_EVEN' ? 'Breakeven' : trade.outcome}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(trade)} className="p-2 rounded-lg cursor-pointer border-none text-[#9CA3AF] hover:text-[#6C5CE7] hover:bg-[#F8F9FC] transition-colors duration-150" title="Edit">
              <Edit3 size={14} />
            </button>
            <button onClick={() => onDelete(trade.id)} className="p-2 rounded-lg cursor-pointer border-none text-[#9CA3AF] hover:text-[#E17055] hover:bg-[#F8F9FC] transition-colors duration-150" title="Delete">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg cursor-pointer border-none text-[#9CA3AF] hover:text-[#1A202C] hover:bg-[#F8F9FC] transition-colors duration-150" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="text-[13px] font-medium text-[#4A5568]">
            {new Date(trade.entry_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            <span className="mx-2 text-[#9CA3AF]">&middot;</span>
            {new Date(trade.entry_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {trade.exit_time && (
              <>
                <span className="mx-2 text-[#9CA3AF]">&rarr;</span>
                {new Date(trade.exit_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: '#F8F9FC', border: '1px solid #EEF0F3' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Entry</span>
              <div className="mt-2">
                <div className="text-xl font-bold text-[#1A202C]">${trade.entry_price.toFixed(2)}</div>
                <div className="text-[12px] mt-1 text-[#9CA3AF]">Qty: {trade.quantity}</div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#F8F9FC', border: '1px solid #EEF0F3' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Exit</span>
              <div className="mt-2">
                <div className="text-xl font-bold" style={{ color: trade.exit_price ? '#1A202C' : '#9CA3AF' }}>
                  {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '\u2014'}
                </div>
                <div className="text-[12px] mt-1 text-[#9CA3AF]">{trade.exit_time ? 'Closed' : 'Open'}</div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#F8F9FC', border: '1px solid #EEF0F3' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">P&amp;L</span>
              <div className="mt-2">
                <div className={`text-xl font-bold ${isProfit ? 'text-[#00B894]' : 'text-[#E17055]'}`}>
                  {isProfit ? '+' : ''}${pnl.toFixed(2)}
                </div>
                {roi && <div className="text-[12px] mt-1" style={{ color: isProfit ? '#00B894' : '#E17055' }}>ROI: {roi.toFixed(2)}%</div>}
              </div>
            </div>
          </div>

          {risk != null && reward != null && (
            <div className="rounded-xl p-4" style={{ background: '#F8F9FC', border: '1px solid #EEF0F3' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Risk Analysis</span>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <span className="text-[12px] text-[#4A5568]">Risk</span>
                  <div className="text-sm font-bold mt-0.5 text-[#1A202C]">${risk.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-[12px] text-[#4A5568]">Reward</span>
                  <div className="text-sm font-bold mt-0.5 text-[#1A202C]">${reward.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-[12px] text-[#4A5568]">R:R</span>
                  <div className={`text-sm font-bold mt-0.5 ${rr && parseFloat(rr) >= 2 ? 'text-[#00B894]' : rr && parseFloat(rr) >= 1 ? 'text-[#F59E0B]' : 'text-[#E17055]'}`}>
                    {rr ? `1:${rr}` : '\u2014'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {trade.session && (
            <div className="text-[12px] text-[#4A5568]">
              Session: <span className="font-medium text-[#1A202C]">{trade.session}</span>
            </div>
          )}

          {trade.notes && (
            <div className="rounded-xl p-4" style={{ background: '#F8F9FC', border: '1px solid #EEF0F3' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Notes</span>
              <div className="mt-2 text-[13px] leading-relaxed text-[#4A5568]">{trade.notes}</div>
            </div>
          )}

          <div className="rounded-xl p-4" style={{ background: '#F8F9FC', border: '1px solid #EEF0F3' }}>
            <ScreenshotUpload tradeId={trade.id} />
          </div>

          {trade.setup_tags && trade.setup_tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {trade.setup_tags.map((tag) => (
                <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-lg" style={{ background: 'rgba(108,92,231,0.10)', color: '#6C5CE7' }}>{tag}</span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(trade)} className="flex-1 py-[10px] rounded-lg text-[13px] font-semibold cursor-pointer border-none text-white transition-[background] duration-200" style={{ background: '#6C5CE7' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#5B4BD4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6C5CE7'; }}
            >Edit Trade</button>
            <button onClick={() => onDelete(trade.id)} className="flex-1 py-[10px] rounded-lg text-[13px] font-semibold cursor-pointer border-none text-[#E17055] transition-[background] duration-200" style={{ background: 'rgba(225,112,85,0.10)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(225,112,85,0.20)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(225,112,85,0.10)'; }}
            >Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailCard;
