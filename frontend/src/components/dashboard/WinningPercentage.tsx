import { PieChart, Pie, Cell } from 'recharts'
import type { DashboardStats } from '../../lib/api'

interface WinningPercentageProps {
  stats: DashboardStats | null
  loading: boolean
}

const COLORS = ['#00b894', '#e17055']

export default function WinningPercentage({ stats, loading }: WinningPercentageProps) {
  const wins = stats?.wins ?? 108
  const losses = stats?.losses ?? 108
  const total = wins + losses
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 50

  const data = [
    { name: 'Wins', value: wins || 1 },
    { name: 'Losses', value: losses || 1 },
  ]

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
      <p className="text-[13px] font-semibold text-[#1f2937] mb-4">Winning % By Trades</p>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9ca3af] text-[13px]">Loading...</div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: 160, height: 160 }}>
            <PieChart width={160} height={160}>
              <Pie
                data={data}
                cx={80}
                cy={80}
                innerRadius={52}
                outerRadius={72}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
            <div
              className="absolute flex flex-col items-center justify-center"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-[28px] font-bold text-[#00b894]">{winPct}%</span>
            </div>
          </div>
          <div className="flex items-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#00b894' }} />
              <span className="text-[12px] font-medium text-[#4a5568]">{wins} winners</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#e17055' }} />
              <span className="text-[12px] font-medium text-[#4a5568]">{losses} losers</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
