import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarDay } from '../../lib/api'

interface CalendarProps {
  days: CalendarDay[]
  loading: boolean
  currentMonth?: Date
  onPrevMonth?: () => void
  onNextMonth?: () => void
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildWeeks(days: CalendarDay[], month: number) {
  const year = days[0]?.date ? new Date(days[0].date).getFullYear() : new Date().getFullYear()
  const firstDay = new Date(year, month - 1, 1)
  const startPad = firstDay.getDay()
  const weeks: (CalendarDay | null)[][] = []
  let week: (CalendarDay | null)[] = []

  for (let i = 0; i < startPad; i++) {
    week.push(null)
  }

  for (const day of days) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null)
    }
    weeks.push(week)
  }

  return weeks
}

export default function Calendar({ days, loading, currentMonth, onPrevMonth, onNextMonth }: CalendarProps) {
  if (loading) {
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
        <p className="text-[13px] font-semibold text-[#1f2937] mb-4">Monthly Calendar</p>
        <div className="flex items-center justify-center h-48 text-[#9ca3af] text-[13px]">Loading...</div>
      </div>
    )
  }

  const now = currentMonth || new Date()
  const month = now.getMonth() + 1
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[month - 1]
  const weeks = buildWeeks(days, month)

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onPrevMonth} className="flex items-center justify-center p-1 rounded hover:bg-[#f3f4f6] transition-colors text-[#9ca3af] cursor-pointer border-none">
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
          <span className="text-[13px] font-semibold text-[#1f2937]">{monthName} {now.getFullYear()}</span>
          <button onClick={onNextMonth} className="flex items-center justify-center p-1 rounded hover:bg-[#f3f4f6] transition-colors text-[#9ca3af] cursor-pointer border-none">
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7" style={{ gap: 0 }}>
        {weekDays.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-[#9ca3af] text-center pb-2">
            {d}
          </div>
        ))}

        {weeks.flat().map((cell, i) => {
          if (!cell) {
            return (
              <div key={i} style={{ minHeight: 80, border: '1px solid #eef0f3', padding: 8, background: '#fff' }} />
            )
          }

          const hasTrades = cell.trades > 0
          return (
            <div
              key={i}
              style={{
                minHeight: 80,
                border: '1px solid #eef0f3',
                padding: 8,
                background: hasTrades
                  ? cell.positive
                    ? '#f0fdf4'
                    : '#fff5f5'
                  : '#fff',
              }}
            >
              <div className="text-[12px] font-medium text-[#9ca3af]">{cell.day}</div>
              {hasTrades && (
                <div className="flex flex-col items-center mt-1">
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: cell.positive ? '#00b894' : '#e17055' }}
                  >
                    {cell.pnl >= 0 ? '+' : ''}${Math.abs(cell.pnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                  <span className="text-[11px] text-[#9ca3af] mt-0.5">
                    {cell.trades} trade{cell.trades !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
