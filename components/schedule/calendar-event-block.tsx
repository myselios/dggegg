'use client'

import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ScheduleEventWithStudent } from '@/lib/types/database'

/** Left border color by course */
const borderColors: Record<string, string> = {
  'Ab initio': 'border-l-green-500 dark:border-l-green-400',
  'SL': 'border-l-blue-500 dark:border-l-blue-400',
  'HL': 'border-l-purple-500 dark:border-l-purple-400',
}

/** Content area background + text */
const contentColors: Record<string, string> = {
  'Ab initio': 'bg-green-100/80 text-green-900 dark:bg-green-900/60 dark:text-green-100',
  'SL': 'bg-blue-100/80 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100',
  'HL': 'bg-purple-100/80 text-purple-900 dark:bg-purple-900/60 dark:text-purple-100',
}

const completedBorderColor = 'border-l-emerald-500 dark:border-l-emerald-400'
const completedContentColor = 'bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'

export function CalendarEventBlock({
  event,
  onClick,
  hasConflict = false,
  cellHeightPx,
  offsetMinutes = 0,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClick: () => void
  readonly hasConflict?: boolean
  readonly cellHeightPx: number
  readonly offsetMinutes?: number
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  const durationMinutes = Math.max(15, (new Date(event.end_at).getTime() - new Date(event.start_at).getTime()) / 60000)
  const pxPerMinute = cellHeightPx / 60
  const heightPx = durationMinutes * pxPerMinute
  const topPx = offsetMinutes * pxPerMinute

  const isMemo = event.event_type === 'memo' || (!event.student_id && event.title)
  const course = event.students?.ib_course ?? ''
  const isCompleted = event.status === 'completed'

  const borderColor = isMemo
    ? 'border-l-yellow-500 dark:border-l-yellow-400'
    : isCompleted
      ? completedBorderColor
      : (borderColors[course] ?? 'border-l-gray-400 dark:border-l-gray-500')
  const contentColor = isMemo
    ? 'bg-yellow-100/80 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-100'
    : isCompleted
      ? completedContentColor
      : (contentColors[course] ?? 'bg-gray-100/80 text-gray-900 dark:bg-gray-800/60 dark:text-gray-100')

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0.5 right-0.5 flex rounded-sm text-left text-xs overflow-hidden border-l-[3px]',
        borderColor,
        contentColor,
        'transition-shadow hover:shadow-md',
        isDragging && 'opacity-30',
        hasConflict && 'ring-2 ring-red-500 dark:ring-red-400'
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      data-testid="event-block"
    >
      {/* LEFT: Click zone → opens popup */}
      <div
        data-testid="event-click-bar"
        className="flex-1 min-w-0 cursor-pointer px-1 py-0.5"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <div className="pointer-events-none h-full overflow-hidden">
          <div className="flex items-start gap-0.5 min-w-0">
            {hasConflict && (
              <AlertTriangle className="mt-0.5 size-2.5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            {isCompleted && (
              <Check className="mt-0.5 size-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="font-semibold break-words line-clamp-3 leading-tight text-[11px]">
              {isMemo
                ? event.title
                : event.title
                  ? `${event.students?.name_ko}(${event.title})`
                  : event.students?.name_ko}
            </span>
          </div>
          {event.template_type && (
            <div className="text-[9px] leading-tight opacity-60">{event.template_type}</div>
          )}
        </div>
      </div>

      {/* RIGHT: Drag handle */}
      <div
        className="flex w-4 shrink-0 cursor-grab items-center justify-center border-l border-black/5 text-current/20 hover:text-current/50 active:cursor-grabbing dark:border-white/10"
        style={{ touchAction: 'none' }}
        {...listeners}
        {...attributes}
      >
        <svg width="4" height="10" viewBox="0 0 4 10" fill="currentColor" className="opacity-30">
          <circle cx="1" cy="1" r="0.8" />
          <circle cx="3" cy="1" r="0.8" />
          <circle cx="1" cy="5" r="0.8" />
          <circle cx="3" cy="5" r="0.8" />
          <circle cx="1" cy="9" r="0.8" />
          <circle cx="3" cy="9" r="0.8" />
        </svg>
      </div>
    </div>
  )
}

/** Presentational-only block used inside DragOverlay (no drag hooks). */
export function CalendarEventBlockOverlay({
  event,
}: {
  readonly event: ScheduleEventWithStudent
}) {
  const isMemo = event.event_type === 'memo' || (!event.student_id && event.title)
  const course = event.students?.ib_course ?? ''
  const borderColor = isMemo
    ? 'border-l-yellow-500'
    : (borderColors[course] ?? 'border-l-gray-400')
  const contentColor = isMemo
    ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
    : (contentColors[course] ?? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100')

  return (
    <div className={cn(
      'flex w-40 rounded-sm text-left text-xs shadow-lg rotate-2 overflow-hidden border-l-[3px]',
      borderColor, contentColor
    )}>
      <div className="flex-1 px-1.5 py-1">
        <div className="font-semibold truncate">
          {isMemo ? event.title : event.students?.name_ko}
        </div>
        {event.template_type && (
          <div className="text-[10px] opacity-60">{event.template_type}</div>
        )}
      </div>
    </div>
  )
}
