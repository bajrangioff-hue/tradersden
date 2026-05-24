import { Plus, Edit3 } from 'lucide-react'

interface SubHeaderProps {
  loading: boolean
  lastUpdated: string | null
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning!'
  if (h < 18) return 'Good afternoon!'
  return 'Good evening!'
}

export default function SubHeader({ loading, lastUpdated }: SubHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3" style={{ background: '#F8F9FC' }}>
      <p className="text-[14px] font-medium text-[#4A5568]">
        {getGreeting()} Here's your trading overview.
      </p>

      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[#9CA3AF]">
          {loading ? 'Loading...' : lastUpdated ? `Last updated ${lastUpdated}` : 'No data yet'}
        </span>

        <button className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer px-3 py-[6px] rounded-lg text-[#4A5568] bg-white" style={{ border: '1px solid #D1D5DB' }}>
          <Edit3 size={12} strokeWidth={1.5} />
          Edit Widgets
        </button>

        <button className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer px-3.5 py-[6px] rounded-lg bg-[#6C5CE7] text-white border-none">
          <Plus size={12} strokeWidth={2.5} />
          Import Trades
        </button>
      </div>
    </div>
  )
}
