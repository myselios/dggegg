'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { addWeeks, subWeeks, isSameDay, isToday, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getWeeksInRange } from '@/lib/utils/date'
import { updateScheduleEvent } from '@/app/actions/schedule'
import { CalendarEventBlock, CalendarEventBlockOverlay } from './calendar-event-block'
import { DroppableCell } from './droppable-cell'
import { EventCreateDialog } from './event-create-dialog'
import { LessonNotePanel } from './lesson-note-panel'
import { Button } from '@/components/ui/button'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 ~ 22:00
const MINUTES_10 = [0, 10, 20, 30, 40, 50] as const

/** Encode a cell position into a droppable id */
function cellId(dayIdx: number, hour: number): string {
  return `cell-${dayIdx}-${hour}`
}

/** Decode a droppable id back to day index and hour */
function parseCellId(id: string): { dayIdx: number; hour: number } | null {
  const match = id.match(/^cell-(\d+)-(\d+)$/)
  if (!match) return null
  return { dayIdx: Number(match[1]), hour: Number(match[2]) }
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

export function ThreeWeekCalendar({
  initialDate,
}: {
  readonly initialDate?: string
}) {
  const [baseDate, setBaseDate] = useState(() => parseInitialDate(initialDate))
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [activeEvent, setActiveEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [overCellId, setOverCellId] = useState<string | null>(null)

  const { start, end } = useMemo(() => getThreeWeekRange(baseDate), [baseDate])
  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])
  const allDays = useMemo(() => weeks.flat(), [weeks])

  const { data: events, mutate } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

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
    newStart.setHours(target.hour, 0, 0, 0)
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

  // Require 8px of movement before starting drag so clicks still work
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
    newStart.setHours(target.hour, 0, 0, 0)
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

  return (
    <div className="flex flex-col gap-4">
      {/* Header: navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">스케줄</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBaseDate(subWeeks(baseDate, 1))}>
            &larr; 이전 주
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date())}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(addWeeks(baseDate, 1))}>
            다음 주 &rarr;
          </Button>
        </div>
      </div>

      {/* Week range headers */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {weeks.map((week, i) => (
          <span key={i} className="flex-1 text-center font-medium">
            {format(week[0], 'M월 d일', { locale: ko })} ~ {format(week[6], 'M월 d일', { locale: ko })}
          </span>
        ))}
      </div>

      {/* Calendar grid with DnD */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative overflow-auto max-h-[calc(100vh-220px)] rounded-lg border">
          <div className="min-w-[1200px]">
            {/* Day headers - sticky top */}
            <div className="sticky top-0 z-30 grid grid-cols-[64px_repeat(21,1fr)] border-b bg-background">
              <div className="sticky left-0 z-40 bg-background" />
              {allDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'border-l px-1 py-2 text-center text-xs',
                    isToday(day) && 'bg-primary/10 font-bold',
                    i % 7 === 0 && i > 0 && 'border-l-2 border-l-primary/30'
                  )}
                >
                  <div>{format(day, 'EEE', { locale: ko })}</div>
                  <div className={cn(
                    'text-lg',
                    isToday(day) && 'rounded-full bg-primary text-primary-foreground mx-auto w-8 h-8 flex items-center justify-center'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Hour rows with 10-min subdivisions */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[64px_repeat(21,1fr)]">
                {/* Time labels - sticky left, 6 sub-rows */}
                <div className="sticky left-0 z-20 flex flex-col border-r bg-background">
                  {MINUTES_10.map((min) => (
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
                  ))}
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
                      isWeekBoundary={dayIdx % 7 === 0 && dayIdx > 0}
                      hasConflictPreview={dragConflictCellId === currentCellId}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const yOffset = e.clientY - rect.top
                        const minuteRaw = Math.floor((yOffset / rect.height) * 60)
                        const minute = Math.max(0, Math.min(50, Math.floor(minuteRaw / 10) * 10))
                        setSelectedSlot({ date: day, hour, minute })
                      }}
                    >
                      {cellEvents.map((event) => (
                        <CalendarEventBlock
                          key={event.id}
                          event={event}
                          hasConflict={conflictingIds.has(event.id)}
                          onClick={() => {
                            setSelectedEvent(event)
                            setSelectedSlot(null)
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
          {activeEvent ? <CalendarEventBlockOverlay event={activeEvent} /> : null}
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
    </div>
  )
}
