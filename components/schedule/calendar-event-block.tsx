'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ScheduleEventWithStudent } from '@/lib/types/database'

/** Left color bar (click zone) */
const barColors: Record<string, string> = {
  'Ab initio': 'bg-green-500 dark:bg-green-600',
  'SL': 'bg-blue-500 dark:bg-blue-600',
  'HL': 'bg-purple-500 dark:bg-purple-600',
}

/** Content area background + text */
const contentColors: Record<string, string> = {
  'Ab initio': 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
  'SL': 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
  'HL': 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
}

/** Status-specific bar colors (override course colors) */
const statusBarColors: Record<string, string> = {
  completed: 'bg-emerald-500 dark:bg-emerald-600',
  cancelled: 'bg-gray-300 dark:bg-gray-600',
  no_show: 'bg-red-400 dark:bg-red-500',
}

/** Status-specific content colors (override course colors) */
const statusContentColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  cancelled: 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500',
  no_show: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
}

const statusStyles: Record<string, string> = {
  cancelled: 'line-through',
}

export function CalendarEventBlock({
  event,
  onClick,
  onAddMakeup,
  hasConflict = false,
  cellHeightPx,
  offsetMinutes = 0,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClick: () => void
  readonly onAddMakeup?: (event: ScheduleEventWithStudent) => void
  readonly hasConflict?: boolean
  readonly cellHeightPx: number
  readonly offsetMinutes?: number
}) {
  const [isHovered, setIsHovered] = useState(false)
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
  const isCancelled = event.status === 'cancelled'
  const hasStatusColor = event.status in statusBarColors

  const barColor = isMemo
    ? 'bg-yellow-500 dark:bg-yellow-600'
    : hasStatusColor
      ? statusBarColors[event.status]
      : (barColors[course] ?? 'bg-gray-400 dark:bg-gray-500')
  const contentColor = isMemo
    ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
    : hasStatusColor
      ? statusContentColors[event.status]
      : (contentColors[course] ?? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100')
  const statusClass = statusStyles[event.status] ?? ''
  const showAddOverlay = isCancelled && onAddMakeup && isHovered

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0.5 right-0.5 flex rounded text-left text-xs transition-shadow hover:shadow-md overflow-hidden',
        statusClass,
        isDragging && 'opacity-30',
        hasConflict && 'ring-2 ring-red-500 dark:ring-red-400'
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      data-testid="event-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left color bar — CLICK zone */}
      <div
        data-testid="event-click-bar"
        className={cn(
          'w-3 shrink-0 cursor-pointer transition-all hover:brightness-90',
          barColor
        )}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      />

      {/* Right content — DRAG zone */}
      <div
        className={cn(
          'flex-1 min-w-0 px-2 py-1 cursor-grab active:cursor-grabbing',
          contentColor
        )}
        style={{ touchAction: 'none' }}
        {...listeners}
        {...attributes}
      >
        <div className="pointer-events-none h-full overflow-hidden">
          <div className="flex items-start gap-1 min-w-0">
            {hasConflict && (
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
            )}
            {isCompleted && (
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="font-semibold break-words line-clamp-3">
              {isMemo ? event.title : event.students?.name_ko}
            </span>
          </div>
          {event.template_type && (
            <div className="text-[10px] opacity-60">{event.template_type}</div>
          )}
        </div>
      </div>

      {/* Add makeup overlay for cancelled events */}
      {showAddOverlay && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 rounded cursor-pointer hover:bg-black/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onAddMakeup(event)
          }}
        >
          <Plus className="h-6 w-6 text-white drop-shadow-md" />
        </div>
      )}
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
  const barColor = isMemo
    ? 'bg-yellow-500 dark:bg-yellow-600'
    : (barColors[course] ?? 'bg-gray-400 dark:bg-gray-500')
  const contentColor = isMemo
    ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
    : (contentColors[course] ?? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100')

  return (
    <div className="flex w-40 rounded text-left text-xs shadow-lg rotate-2 overflow-hidden">
      <div className={cn('w-3 shrink-0', barColor)} />
      <div className={cn('flex-1 px-2 py-1', contentColor)}>
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
