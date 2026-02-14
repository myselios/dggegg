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

export function ThreeWeekCalendar() {
  const [baseDate, setBaseDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [activeEvent, setActiveEvent] = useState<ScheduleEventWithStudent | null>(null)

  const { start, end } = useMemo(() => getThreeWeekRange(baseDate), [baseDate])
  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])
  const allDays = useMemo(() => weeks.flat(), [weeks])

  const { data: events, mutate } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveEvent(null)

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
          await updateScheduleEvent(droppedEvent.id, {
            start_at: newStart.toISOString(),
            end_at: newEnd.toISOString(),
          })
          return optimisticEvents ?? []
        },
        { optimisticData: optimisticEvents, rollbackOnError: true }
      )
      toast.success('수업 일정이 변경되었습니다')
    } catch {
      toast.error('일정 변경에 실패했습니다')
    }
  }, [allDays, events, mutate])

  const handleDragCancel = useCallback(() => {
    setActiveEvent(null)
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
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(21,1fr)] border-b">
              <div />
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

            {/* Hour rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(21,1fr)] border-b">
                <div className="flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground">
                  {`${hour}:00`}
                </div>
                {allDays.map((day, dayIdx) => {
                  const cellEvents = getEventsForDayHour(day, hour)
                  return (
                    <DroppableCell
                      key={dayIdx}
                      id={cellId(dayIdx, hour)}
                      isToday={isToday(day)}
                      isWeekBoundary={dayIdx % 7 === 0 && dayIdx > 0}
                      onClick={() => setSelectedSlot({ date: day, hour })}
                    >
                      {cellEvents.map((event) => (
                        <CalendarEventBlock
                          key={event.id}
                          event={event}
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
