import { useState } from 'react'

export interface PositionRow {
  openDate: string
  symbol: string
  netPnl: string
  positive: boolean
  direction?: string
  rValue?: string
}

interface TabsTableProps {
  openPositions: PositionRow[]
  recentTrades: PositionRow[]
  loading: boolean
}

export default function TabsTable({ openPositions, recentTrades, loading }: TabsTableProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'recent'>('open')

  const rows = activeTab === 'open' ? openPositions : recentTrades

  return (
    <div
      className="bg-white"
      style={{
        borderRadius: 12,
        border: '1px solid #eef0f3',
        padding: '20px 24px',
        height: '100%',
      }}
    >
      <div className="flex items-center gap-6 mb-4">
        <button
          className="text-[13px] font-semibold cursor-pointer pb-1 relative"
          onClick={() => setActiveTab('open')}
          style={{ color: activeTab === 'open' ? '#1a202c' : '#9ca3af' }}
        >
          Open Positions
          {activeTab === 'open' && (
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 2, background: '#6c5ce7', borderRadius: 1 }}
            />
          )}
        </button>
        <button
          className="text-[13px] font-semibold cursor-pointer pb-1 relative"
          onClick={() => setActiveTab('recent')}
          style={{ color: activeTab === 'recent' ? '#1a202c' : '#9ca3af' }}
        >
          Recent Trades
          {activeTab === 'recent' && (
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 2, background: '#6c5ce7', borderRadius: 1 }}
            />
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-[#9ca3af] text-[13px]">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[#9ca3af] text-[13px]">No {activeTab === 'open' ? 'open positions' : 'recent trades'}</div>
      ) : (
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold tracking-[0.06em] text-[#9ca3af] uppercase pb-3">
                Open Date
              </th>
              <th className="text-left text-[11px] font-semibold tracking-[0.06em] text-[#9ca3af] uppercase pb-3">
                Symbol
              </th>
              <th className="text-right text-[11px] font-semibold tracking-[0.06em] text-[#9ca3af] uppercase pb-3">
                Net P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 1 ? '#f8f9fc' : '#fff',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <td className="text-[13px]" style={{ padding: '10px 0', color: '#4a5568', fontWeight: 500 }}>
                  {row.openDate}
                </td>
                <td className="text-[13px] font-semibold" style={{ padding: '10px 0', color: '#1a202c' }}>
                  {row.symbol}
                </td>
                <td
                  className="text-right text-[13px] font-semibold"
                  style={{ padding: '10px 0', color: row.positive ? '#00b894' : '#e17055' }}
                >
                  {row.netPnl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
