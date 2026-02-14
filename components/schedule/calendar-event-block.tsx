'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const courseColors: Record<string, string> = {
  'Ab initio': 'bg-green-200 border-green-400 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-100',
  'SL': 'bg-blue-200 border-blue-400 text-blue-900 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100',
  'HL': 'bg-purple-200 border-purple-400 text-purple-900 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-100',
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  const course = event.students?.ib_course ?? ''
  const colorClass = courseColors[course] ?? 'bg-gray-200 border-gray-400 text-gray-900'
  const statusClass = statusStyles[event.status] ?? ''

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'w-full rounded border-l-4 px-2 py-1 text-left text-xs transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing',
        colorClass,
        statusClass,
        isDragging && 'opacity-30'
      )}
      {...listeners}
      {...attributes}
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

/** Presentational-only block used inside DragOverlay (no drag hooks). */
export function CalendarEventBlockOverlay({
  event,
}: {
  readonly event: ScheduleEventWithStudent
}) {
  const course = event.students?.ib_course ?? ''
  const colorClass = courseColors[course] ?? 'bg-gray-200 border-gray-400 text-gray-900'

  return (
    <div
      className={cn(
        'w-40 rounded border-l-4 px-2 py-1 text-left text-xs shadow-lg rotate-2',
        colorClass
      )}
    >
      <div className="font-semibold truncate">{event.students?.name_ko}</div>
      <div className="text-[10px] opacity-75">
        {formatTime(event.start_at)} - {formatTime(event.end_at)}
      </div>
      {event.template_type && (
        <div className="text-[10px] opacity-60">{event.template_type}</div>
      )}
    </div>
  )
}
