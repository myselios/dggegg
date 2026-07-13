'use client'

import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, Check, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ScheduleEventWithStudent } from '@/lib/types/database'

type BlockStyle = {
  readonly border: string
  readonly content: string
}

/** Status-driven visual language: 예정=블루, 완료=초록, 취소/노쇼=회색, 메모=앰버 */
const SCHEDULED_STYLE: BlockStyle = {
  border: 'border-l-primary',
  content: 'bg-accent text-accent-foreground',
}
const COMPLETED_STYLE: BlockStyle = {
  border: 'border-l-emerald-500',
  content: 'bg-emerald-50 text-emerald-800',
}
const INACTIVE_STYLE: BlockStyle = {
  border: 'border-l-slate-400',
  content: 'bg-slate-100 text-slate-500',
}
const MEMO_STYLE: BlockStyle = {
  border: 'border-l-amber-500',
  content: 'bg-amber-100 text-amber-900',
}

function resolveStyle(event: Pick<ScheduleEventWithStudent, 'event_type' | 'student_id' | 'title' | 'status'>): BlockStyle {
  const isMemo = event.event_type === 'memo' || (!event.student_id && event.title)
  if (isMemo) return MEMO_STYLE
  if (event.status === 'cancelled' || event.status === 'no_show') return INACTIVE_STYLE
  if (event.status === 'completed') return COMPLETED_STYLE
  return SCHEDULED_STYLE
}

const statusLabel: Record<string, string> = {
  cancelled: '취소',
  no_show: '노쇼',
}

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
  const isCompleted = event.status === 'completed'
  const isInactive = event.status === 'cancelled' || event.status === 'no_show'
  const style = resolveStyle(event)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0.5 right-0.5 flex rounded-md text-left text-xs overflow-hidden border-l-[3px] shadow-sm',
        style.border,
        style.content,
        'transition-shadow hover:shadow-md',
        isDragging && 'opacity-30',
        isInactive && 'opacity-75',
        hasConflict && 'ring-2 ring-red-500'
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      data-testid="event-block"
    >
      {/* LEFT: Click zone → opens popup */}
      <div
        data-testid="event-click-bar"
        className="flex-1 min-w-0 cursor-pointer px-1.5 py-0.5"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <div className="pointer-events-none h-full overflow-hidden">
          <div className="flex items-start gap-0.5 min-w-0">
            {hasConflict && (
              <AlertTriangle className="mt-0.5 size-2.5 shrink-0 text-red-600" />
            )}
            {isCompleted && (
              <Check className="mt-0.5 size-2.5 shrink-0 text-emerald-600" />
            )}
            {isInactive && (
              <Ban className="mt-0.5 size-2.5 shrink-0 text-slate-500" />
            )}
            <span className={cn(
              'font-semibold break-words line-clamp-3 leading-tight text-[11px]',
              isInactive && 'line-through decoration-slate-400'
            )}>
              {isMemo
                ? event.title
                : event.title
                  ? `${event.students?.name_ko}(${event.title})`
                  : event.students?.name_ko}
            </span>
          </div>
          {isInactive ? (
            <div className="text-[9px] leading-tight opacity-70">{statusLabel[event.status]}</div>
          ) : event.template_type ? (
            <div className="text-[9px] leading-tight opacity-60">{event.template_type}</div>
          ) : null}
        </div>
      </div>

      {/* RIGHT: Drag handle */}
      <div
        className="flex w-4 shrink-0 cursor-grab items-center justify-center border-l border-black/5 text-current/20 hover:text-current/50 active:cursor-grabbing"
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
  const style = resolveStyle(event)

  return (
    <div className={cn(
      'flex w-40 rounded-md text-left text-xs shadow-lg rotate-2 overflow-hidden border-l-[3px]',
      style.border, style.content
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
