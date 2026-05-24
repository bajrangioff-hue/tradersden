import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import type { PnLSeriesPoint } from '../../lib/api'

interface DailyCumulativePnLProps {
  data: PnLSeriesPoint[]
  loading: boolean
}

export default function DailyCumulativePnL({ data, loading }: DailyCumulativePnLProps) {
  const chartData = data.map((d) => ({
    day: d.display,
    pnl: d.cumulative_pnl,
    positive: d.cumulative_pnl >= 0 ? d.cumulative_pnl : 0,
    negative: d.cumulative_pnl < 0 ? d.cumulative_pnl : 0,
  }))

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
      <p className="text-[13px] font-semibold text-[#1f2937] mb-4">Daily Net Cumulative P&L</p>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9ca3af] text-[13px]">Loading...</div>
      ) : (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: -4 }}
            >
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b894" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00b894" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e17055" stopOpacity={0} />
                  <stop offset="100%" stopColor="#e17055" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f3f4f6" vertical={false} />
              <ReferenceLine y={0} stroke="#cbd5e0" strokeDasharray="4 4" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'P&L']}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stroke="#00b894"
                strokeWidth={2}
                fill="url(#greenGrad)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="negative"
                stroke="#e17055"
                strokeWidth={2}
                fill="url(#redGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
