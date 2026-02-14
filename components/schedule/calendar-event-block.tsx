'use client'

import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const courseColors: Record<string, string> = {
  'Ab initio': 'bg-green-200 border-green-400 text-green-900',
  'SL': 'bg-blue-200 border-blue-400 text-blue-900',
  'HL': 'bg-purple-200 border-purple-400 text-purple-900',
}

const statusStyles: Record<string, string> = {
  completed: 'opacity-60',
  cancelled: 'opacity-40 line-through',
  no_show: 'opacity-40 bg-red-100 border-red-300',
}

export function CalendarEventBlock({
  event,
  onClick,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClick: () => void
}) {
  const course = event.students?.ib_course ?? ''
  const colorClass = courseColors[course] ?? 'bg-gray-200 border-gray-400 text-gray-900'
  const statusClass = statusStyles[event.status] ?? ''

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'w-full rounded border-l-4 px-2 py-1 text-left text-xs transition-shadow hover:shadow-md',
        colorClass,
        statusClass
      )}
    >
      <div className="font-semibold truncate">{event.students?.name_ko}</div>
      <div className="text-[10px] opacity-75">
        {formatTime(event.start_at)} - {formatTime(event.end_at)}
      </div>
      {event.template_type && (
        <div className="text-[10px] opacity-60">{event.template_type}</div>
      )}
    </button>
  )
}
