import type { DashboardStats } from '../../lib/api'

interface StatCardsProps {
  stats: DashboardStats | null
  loading: boolean
}

export default function StatCards({ stats, loading }: StatCardsProps) {
  const cards = [
    {
      label: 'Net P&L Month',
      value: stats ? `${stats.net_pnl >= 0 ? '+' : ''}$${stats.net_pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-',
      change: stats ? `${stats.net_pnl_change >= 0 ? '+' : ''}${stats.net_pnl_change}% this month` : '',
      positive: stats ? stats.net_pnl >= 0 : true,
    },
    {
      label: 'Win Rate',
      value: stats ? `${stats.win_rate}%` : '-',
      change: stats ? `${stats.win_rate_change >= 0 ? '+' : ''}${stats.win_rate_change}% vs last month` : '',
      positive: stats ? stats.win_rate_change >= 0 : true,
    },
    {
      label: 'Profit Factor',
      value: stats ? stats.profit_factor.toFixed(2) : '-',
      change: '-',
      positive: true,
    },
    {
      label: 'Max Drawdown',
      value: stats ? `${stats.max_drawdown}%` : '-',
      change: '-',
      positive: false,
    },
    {
      label: 'Avg RR Ratio',
      value: stats ? `1:${stats.avg_rr_ratio.toFixed(1)}` : '-',
      change: '-',
      positive: true,
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-3.5" style={{ gap: '14px' }}>
      {cards.map((card, idx) => {
        const isNeg = card.value.startsWith('-')
        const valueColor = isNeg ? 'text-[#e17055]' : 'text-[#00b894]'
        return (
          <div
            key={card.label}
            className="bg-white"
            style={{
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #eef0f3',
            }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9ca3af] mb-2">
              {card.label}
            </p>
            <p className={`text-[24px] font-bold ${loading ? 'text-gray-300' : valueColor}`}>
              {loading ? '—' : card.value}
            </p>
            {idx === 1 && stats && (
              <div className="flex items-center gap-1.5 mt-1.5 mb-1">
                <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                  <path
                    d="M2 16 Q9 4 18 12 Q27 20 34 8"
                    stroke="#00b894"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}
            {idx === 4 && stats && (
              <div className="flex items-center gap-1.5 mt-1.5 mb-1">
                <div className="flex-1 h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-[#00b894]" />
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div className="h-full w-1/4 rounded-full bg-[#e17055]" />
                </div>
              </div>
            )}
            {card.change && (
              <p className={`text-[11px] mt-1 ${card.positive ? 'text-[#00b894]' : 'text-[#e17055]'}`}>
                {card.change}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
