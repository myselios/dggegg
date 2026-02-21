'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { addWeeks, subWeeks, addDays, subDays, isSameDay, isToday, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getOneWeekRange, getWeeksInRange } from '@/lib/utils/date'
import { updateScheduleEvent } from '@/app/actions/schedule'
import { CalendarEventBlock, CalendarEventBlockOverlay } from './calendar-event-block'
import { DroppableCell } from './droppable-cell'
import { EventCreateDialog } from './event-create-dialog'
import { LessonNotePanel } from './lesson-note-panel'
import { MemoEditDialog } from './memo-edit-dialog'
import { Button } from '@/components/ui/button'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8) // 08:00 ~ 23:00
const MINUTES_10 = [0, 10, 20, 30, 40, 50] as const
const CELL_HEIGHT_COMPACT = 48  // h-12
const CELL_HEIGHT_EXPANDED = 120 // h-[120px]

type ViewMode = '3week' | '1week' | 'day'

/** Encode a cell position into a droppable id */
function cellId(dayIdx: number, hour: number): string {
  return `cell-${dayIdx}-${hour}`
}

/** Decode a droppable id back to day index, hour and minute */
function parseCellId(id: string): { dayIdx: number; hour: number; minute: number } | null {
  const match = id.match(/^cell-(\d+)-(\d+)-(\d+)$/)
  if (!match) return null
  return { dayIdx: Number(match[1]), hour: Number(match[2]), minute: Number(match[3]) }
}

/** Check if two time ranges overlap: A.start < B.end && B.start < A.end */
function hasTimeOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd)
}

/** Build a set of event IDs that have conflicts with at least one other event */
function findConflictingIds(
  events: readonly ScheduleEventWithStudent[]
): ReadonlySet<string> {
  const ids = new Set<string>()
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]
      if (
        a.status !== 'cancelled' && b.status !== 'cancelled' &&
        hasTimeOverlap(a.start_at, a.end_at, b.start_at, b.end_at)
      ) {
        ids.add(a.id)
        ids.add(b.id)
      }
    }
  }
  return ids
}

function parseInitialDate(dateStr?: string): Date {
  if (!dateStr) return new Date()
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

/** Grid columns CSS for each view mode */
function getGridCols(mode: ViewMode): string {
  switch (mode) {
    case '3week': return 'grid-cols-[52px_repeat(21,1fr)]'
    case '1week': return 'grid-cols-[48px_repeat(7,1fr)]'
    case 'day': return 'grid-cols-[48px_1fr]'
  }
}

export function ThreeWeekCalendar({
  initialDate,
}: {
  readonly initialDate?: string
}) {
  const isMobile = useIsMobile()
  const [baseDate, setBaseDate] = useState(() => parseInitialDate(initialDate))
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [selectedMemo, setSelectedMemo] = useState<ScheduleEventWithStudent | null>(null)
  const [activeEvent, setActiveEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [overCellId, setOverCellId] = useState<string | null>(null)
  const [isCompact, setIsCompact] = useState(true)
  const [mobileView, setMobileView] = useState<'1week' | 'day'>('1week')
  const gridRef = useRef<HTMLDivElement>(null)

  const viewMode: ViewMode = isMobile ? mobileView : '3week'

  // Compute date range based on view mode
  const { start, end } = useMemo(() => {
    if (viewMode === 'day') {
      const dayStart = new Date(baseDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(baseDate)
      dayEnd.setHours(23, 59, 59, 999)
      return { start: dayStart, end: dayEnd }
    }
    if (viewMode === '1week') {
      return getOneWeekRange(baseDate)
    }
    return getThreeWeekRange(baseDate)
  }, [baseDate, viewMode])

  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])
  const allDays = useMemo(() => {
    if (viewMode === 'day') return [new Date(baseDate)]
    return weeks.flat()
  }, [weeks, viewMode, baseDate])

  const { data: events, mutate } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

  // Auto-scroll to today's column on mount
  useEffect(() => {
    if (viewMode !== '3week' || !gridRef.current) return
    const todayIdx = allDays.findIndex((d) => isToday(d))
    if (todayIdx < 0) return
    const container = gridRef.current
    const timeColWidth = 52
    const dayColWidth = (container.scrollWidth - timeColWidth) / allDays.length
    const scrollTarget = timeColWidth + todayIdx * dayColWidth - container.clientWidth / 2 + dayColWidth * 3.5
    container.scrollLeft = Math.max(0, scrollTarget)
  }, [viewMode, allDays])

  // Conflict detection: find all events that overlap with at least one other
  const conflictingIds = useMemo(
    () => findConflictingIds(events ?? []),
    [events]
  )

  // Check if dragging event to a given cell would cause a conflict
  const dragConflictCellId = useMemo(() => {
    if (!activeEvent || !overCellId || !events) return null
    const target = parseCellId(overCellId)
    if (!target) return null

    const targetDay = allDays[target.dayIdx]
    if (!targetDay) return null

    const oldStart = new Date(activeEvent.start_at)
    const oldEnd = new Date(activeEvent.end_at)
    const durationMs = oldEnd.getTime() - oldStart.getTime()

    const newStart = new Date(targetDay)
    newStart.setHours(target.hour, target.minute, 0, 0)
    const newEnd = new Date(newStart.getTime() + durationMs)

    const wouldConflict = events.some(
      (e) =>
        e.id !== activeEvent.id &&
        e.status !== 'cancelled' &&
        hasTimeOverlap(
          newStart.toISOString(),
          newEnd.toISOString(),
          e.start_at,
          e.end_at
        )
    )

    return wouldConflict ? overCellId : null
  }, [activeEvent, overCellId, events, allDays])

  // Distance constraint: move 8px to start drag, allowing clicks to work
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  function getEventsForDayHour(day: Date, hour: number) {
    if (!events) return []
    return events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return isSameDay(eventDate, day) && eventDate.getHours() === hour
    })
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragged = event.active.data.current?.event as ScheduleEventWithStudent | undefined
    if (dragged) {
      setActiveEvent(dragged)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverCellId(event.over ? String(event.over.id) : null)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveEvent(null)
    setOverCellId(null)

    const { active, over } = event
    if (!over) return

    const droppedEvent = active.data.current?.event as ScheduleEventWithStudent | undefined
    if (!droppedEvent) return

    const target = parseCellId(String(over.id))
    if (!target) return

    const targetDay = allDays[target.dayIdx]
    if (!targetDay) return

    const oldStart = new Date(droppedEvent.start_at)
    const oldEnd = new Date(droppedEvent.end_at)
    const durationMs = oldEnd.getTime() - oldStart.getTime()

    const newStart = new Date(targetDay)
    newStart.setHours(target.hour, target.minute, 0, 0)
    const newEnd = new Date(newStart.getTime() + durationMs)

    // No change — skip
    if (newStart.getTime() === oldStart.getTime()) return

    // Optimistic update
    const optimisticEvents = events?.map((e) =>
      e.id === droppedEvent.id
        ? { ...e, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
        : e
    )

    try {
      await mutate(
        async () => {
          const result = await updateScheduleEvent(droppedEvent.id, {
            start_at: newStart.toISOString(),
            end_at: newEnd.toISOString(),
          })
          if (!result.success) {
            throw new Error(result.error)
          }
          return optimisticEvents ?? []
        },
        { optimisticData: optimisticEvents, rollbackOnError: true }
      )
      toast.success('수업 일정이 변경되었습니다')
    } catch (error) {
      const message = error instanceof Error ? error.message : '일정 변경에 실패했습니다'
      toast.error(message)
    }
  }, [allDays, events, mutate])

  const handleDragCancel = useCallback(() => {
    setActiveEvent(null)
    setOverCellId(null)
  }, [])

  // Navigation handlers based on view mode
  const handlePrev = () => {
    if (viewMode === 'day') setBaseDate(subDays(baseDate, 1))
    else setBaseDate(subWeeks(baseDate, 1))
  }
  const handleNext = () => {
    if (viewMode === 'day') setBaseDate(addDays(baseDate, 1))
    else setBaseDate(addWeeks(baseDate, 1))
  }

  const gridCols = getGridCols(viewMode)

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      {/* Header: navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight md:text-2xl">스케줄</h2>
        <div className="flex items-center gap-1 md:gap-2">
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileView(mobileView === '1week' ? 'day' : '1week')}
            >
              {mobileView === '1week' ? '일간' : '주간'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrev}>
            {isMobile ? '\u2190' : '\u2190 이전 주'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date())}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            {isMobile ? '\u2192' : '다음 주 \u2192'}
          </Button>
          {!isMobile && (
            <Button variant="outline" size="sm" onClick={() => setIsCompact(!isCompact)}>
              {isCompact ? '확대' : '축소'}
            </Button>
          )}
        </div>
      </div>

      {/* Calendar grid with DnD */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div ref={gridRef} className="glass-card relative overflow-auto max-h-[calc(100vh-220px)] rounded-2xl border-none" data-testid="calendar-grid">
          <div className={cn(viewMode === '3week' && 'min-w-[1800px]')}>
            {/* Day headers - sticky top (with week range labels for 3week) */}
            <div className={cn('sticky top-0 z-30 grid bg-white/70 dark:bg-white/5 backdrop-blur-lg', gridCols)}>
              {/* Time column spacer */}
              <div className="sticky left-0 z-40 bg-white/70 dark:bg-white/5 backdrop-blur-lg row-span-2" />

              {/* Week range row (3week only) */}
              {viewMode === '3week' && weeks.map((week, wi) => (
                <div
                  key={wi}
                  className={cn(
                    'col-span-7 py-1.5 text-center text-xs font-semibold text-muted-foreground border-b border-border/30',
                    wi > 0 && 'border-l-2 border-l-primary/30'
                  )}
                >
                  {format(week[0], 'M월 d일')} — {format(week[6], 'M월 d일')}
                </div>
              ))}

              {/* Day name + date row */}
              {allDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'border-l border-b px-1 py-1.5 text-center',
                    isToday(day) && 'bg-primary/10 font-bold',
                    viewMode === '3week' && i % 7 === 0 && i > 0 && 'border-l-2 border-l-primary/30'
                  )}
                >
                  <div className="text-[10px] leading-none text-muted-foreground">{format(day, 'EEE', { locale: ko })}</div>
                  <div className={cn(
                    'mt-0.5 text-sm font-semibold leading-none',
                    isToday(day) && 'rounded-full bg-primary text-primary-foreground mx-auto w-6 h-6 flex items-center justify-center text-xs'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Hour rows with 10-min subdivisions */}
            {HOURS.map((hour, hourIdx) => (
              <div key={hour} className={cn('grid relative', gridCols)} style={{ zIndex: HOURS.length - hourIdx }}>
                {/* Time labels - sticky left, compact mode shows only :00 and :30 */}
                <div className="sticky left-0 z-20 flex flex-col border-r bg-background">
                  {isCompact ? (
                    <>
                      <div className="flex h-6 items-center justify-end pr-2 text-right tabular-nums text-xs font-medium text-foreground border-t">
                        {hour}:00
                      </div>
                      <div className="flex h-6 items-center justify-end pr-2 text-right tabular-nums text-[10px] text-muted-foreground border-t border-dashed">
                        :30
                      </div>
                    </>
                  ) : (
                    MINUTES_10.map((min) => (
                      <div
                        key={min}
                        className={cn(
                          'flex h-5 items-center justify-end pr-2 text-right tabular-nums',
                          min === 0
                            ? 'text-xs font-medium text-foreground border-t'
                            : min === 30
                              ? 'text-[10px] text-muted-foreground border-t border-dashed'
                              : 'text-[9px] text-muted-foreground/40'
                        )}
                      >
                        {min === 0 ? `${hour}:00` : `:${String(min).padStart(2, '0')}`}
                      </div>
                    ))
                  )}
                </div>

                {/* Day cells - one per day, full hour height */}
                {allDays.map((day, dayIdx) => {
                  const cellEvents = getEventsForDayHour(day, hour)
                  const currentCellId = cellId(dayIdx, hour)
                  return (
                    <DroppableCell
                      key={dayIdx}
                      id={currentCellId}
                      isToday={isToday(day)}
                      isWeekBoundary={viewMode === '3week' && dayIdx % 7 === 0 && dayIdx > 0}
                      conflictHalfId={dragConflictCellId}
                      compact={isCompact}
                      onClick={() => {
                        setSelectedSlot({ date: day, hour, minute: 0 })
                      }}
                    >
                      {cellEvents.map((event) => (
                        <CalendarEventBlock
                          key={event.id}
                          event={event}
                          hasConflict={conflictingIds.has(event.id)}
                          cellHeightPx={isCompact ? CELL_HEIGHT_COMPACT : CELL_HEIGHT_EXPANDED}
                          offsetMinutes={new Date(event.start_at).getMinutes()}
                          onClick={() => {
                            const isMemo = event.event_type === 'memo' || (!event.student_id && event.title)
                            if (isMemo) {
                              setSelectedMemo(event)
                            } else if (event.student_id) {
                              setSelectedEvent(event)
                              setSelectedSlot(null)
                            }
                          }}
                        />
                      ))}
                    </DroppableCell>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Drag overlay — follows the pointer */}
        <DragOverlay dropAnimation={null}>
          {activeEvent ? <div data-testid="drag-overlay"><CalendarEventBlockOverlay event={activeEvent} /></div> : null}
        </DragOverlay>
      </DndContext>

      {/* Event create dialog */}
      {selectedSlot && (
        <EventCreateDialog
          date={selectedSlot.date}
          hour={selectedSlot.hour}
          minute={selectedSlot.minute}
          existingEvents={events ?? []}
          onClose={() => setSelectedSlot(null)}
          onCreated={() => {
            setSelectedSlot(null)
            mutate()
          }}
        />
      )}

      {/* Lesson note panel */}
      {selectedEvent && (
        <LessonNotePanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={() => {
            setSelectedEvent(null)
            mutate()
          }}
        />
      )}

      {/* Memo edit/delete dialog */}
      {selectedMemo && (
        <MemoEditDialog
          event={selectedMemo}
          onClose={() => setSelectedMemo(null)}
          onDeleted={() => {
            setSelectedMemo(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
