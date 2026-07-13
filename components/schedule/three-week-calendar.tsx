'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { addWeeks, subWeeks, addDays, subDays, isSameDay, isToday, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getOneWeekRange, getWeeksInRange } from '@/lib/utils/date'
import { CalendarEventBlock, CalendarEventBlockOverlay } from './calendar-event-block'
import { DroppableCell } from './droppable-cell'
import { EventCreateDialog } from './event-create-dialog'
import { LessonNotePanel } from './lesson-note-panel'
import { MemoEditDialog } from './memo-edit-dialog'
import { WeeklyMemoPanel } from './weekly-memo-panel'
import { Button } from '@/components/ui/button'
import {
  HOURS,
  MINUTES_10,
  CELL_HEIGHT_COMPACT,
  CELL_HEIGHT_EXPANDED,
  cellId,
  findConflictingIds,
  parseInitialDate,
  getGridCols,
  type ViewMode,
} from '@/lib/utils/calendar-grid'
import { useCalendarDnd } from './hooks/use-calendar-dnd'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

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
  const [isCompact, setIsCompact] = useState(true)
  const [mobileView, setMobileView] = useState<'1week' | 'day'>('1week')
  const gridRef = useRef<HTMLDivElement>(null)

  const viewMode: ViewMode = isMobile ? mobileView : '1week'

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

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (!gridRef.current) return
    const currentHour = new Date().getHours()
    const hourIndex = Math.max(0, currentHour - 7) // HOURS starts at 07
    const rowHeight = isCompact ? CELL_HEIGHT_COMPACT : CELL_HEIGHT_EXPANDED
    const scrollTarget = hourIndex * rowHeight - 80
    gridRef.current.scrollTop = Math.max(0, scrollTarget)
  }, [viewMode, isCompact])

  // Conflict detection: find all events that overlap with at least one other
  const conflictingIds = useMemo(
    () => findConflictingIds(events ?? []),
    [events]
  )

  const dnd = useCalendarDnd({ events, allDays, mutate })

  function getEventsForDayHour(day: Date, hour: number) {
    if (!events) return []
    return events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return isSameDay(eventDate, day) && eventDate.getHours() === hour
    })
  }

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

      {/* Calendar grid + weekly memo side by side (desktop only) */}
      <div className="flex gap-3 items-start">
      {/* Calendar grid with DnD */}
      <DndContext
        sensors={dnd.sensors}
        onDragStart={dnd.onDragStart}
        onDragOver={dnd.onDragOver}
        onDragEnd={dnd.onDragEnd}
        onDragCancel={dnd.onDragCancel}
      >
        <div ref={gridRef} className="glass-card relative overflow-auto max-h-[calc(100vh-220px)] flex-1 rounded-2xl" data-testid="calendar-grid">
          <div>
            {/* Day headers - sticky top */}
            <div className={cn('sticky top-0 z-30 grid bg-card border-b border-border shadow-sm', gridCols)}>
              {/* Time column spacer */}
              <div className="sticky left-0 z-40 bg-card" />

              {/* Day name + date row */}
              {allDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'border-l border-b px-1 py-1.5 text-center',
                    isToday(day) ? 'bg-primary/[0.08] font-bold border-t-2 border-t-primary' : 'border-t-2 border-t-transparent'
                  )}
                >
                  <div className={cn(
                    'text-[10px] leading-none',
                    day.getDay() === 0 ? 'text-destructive font-semibold' : day.getDay() === 6 ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>{format(day, 'EEE', { locale: ko })}</div>
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
                      isWeekBoundary={false}
                      conflictHalfId={dnd.dragConflictCellId}
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
          {dnd.activeEvent ? <div data-testid="drag-overlay"><CalendarEventBlockOverlay event={dnd.activeEvent} /></div> : null}
        </DragOverlay>
      </DndContext>

      {/* Weekly memo panel — desktop only */}
      {!isMobile && <WeeklyMemoPanel baseDate={baseDate} />}
      </div>

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
          onMutated={() => {
            setSelectedMemo(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
