'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, Plus } from 'lucide-react'
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
  onAddMakeup,
  hasConflict = false,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClick: () => void
  readonly onAddMakeup?: (event: ScheduleEventWithStudent) => void
  readonly hasConflict?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  const course = event.students?.ib_course ?? ''
  const colorClass = courseColors[course] ?? 'bg-gray-200 border-gray-400 text-gray-900'
  const statusClass = statusStyles[event.status] ?? ''
  const isCancelled = event.status === 'cancelled'
  const showAddOverlay = isCancelled && onAddMakeup && isHovered

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid="event-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'relative w-full rounded border-l-4 px-2 py-1 text-left text-xs transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing',
        colorClass,
        statusClass,
        isDragging && 'opacity-30',
        hasConflict && 'ring-2 ring-red-500 dark:ring-red-400'
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-1">
        {hasConflict && (
          <AlertTriangle className="h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
        )}
        <span className="font-semibold truncate">{event.students?.name_ko}</span>
      </div>
      <div className="text-[10px] opacity-75" data-testid="event-time">
        {formatTime(event.start_at)} - {formatTime(event.end_at)}
      </div>
      {event.template_type && (
        <div className="text-[10px] opacity-60">{event.template_type}</div>
      )}

      {/* Add makeup overlay for cancelled events */}
      {showAddOverlay && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded cursor-pointer hover:bg-black/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onAddMakeup(event)
          }}
        >
          <Plus className="h-6 w-6 text-white drop-shadow-md" />
        </div>
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
