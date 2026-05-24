import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { PnLSeriesPoint } from '../../lib/api'

interface NetDailyPnLProps {
  data: PnLSeriesPoint[]
  loading: boolean
}

export default function NetDailyPnL({ data, loading }: NetDailyPnLProps) {
  const chartData = data.map((d) => ({
    day: d.display,
    pnl: d.pnl,
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
      <p className="text-[13px] font-semibold text-[#1f2937] mb-4">Net Daily P&L</p>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9ca3af] text-[13px]">Loading...</div>
      ) : (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: -4 }}
            >
              <CartesianGrid stroke="#f3f4f6" vertical={false} />
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
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? '#00b894' : '#e17055'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
