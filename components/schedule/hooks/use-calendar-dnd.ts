'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import type { KeyedMutator } from 'swr'
import { updateScheduleEvent } from '@/app/actions/schedule'
import { hasTimeOverlap, parseCellId } from '@/lib/utils/calendar-grid'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

interface UseCalendarDndArgs {
  readonly events: readonly ScheduleEventWithStudent[] | undefined
  readonly allDays: readonly Date[]
  readonly mutate: KeyedMutator<ScheduleEventWithStudent[]>
}

/**
 * Owns drag-and-drop state for the calendar: sensors, active event, hover cell,
 * conflict preview, and the optimistic update on drop.
 */
export function useCalendarDnd({ events, allDays, mutate }: UseCalendarDndArgs) {
  const [activeEvent, setActiveEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [overCellId, setOverCellId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

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
        hasTimeOverlap(newStart.toISOString(), newEnd.toISOString(), e.start_at, e.end_at),
    )

    return wouldConflict ? overCellId : null
  }, [activeEvent, overCellId, events, allDays])

  const onDragStart = useCallback((event: DragStartEvent) => {
    const dragged = event.active.data.current?.event as ScheduleEventWithStudent | undefined
    if (dragged) setActiveEvent(dragged)
  }, [])

  const onDragOver = useCallback((event: DragOverEvent) => {
    setOverCellId(event.over ? String(event.over.id) : null)
  }, [])

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
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

      if (newStart.getTime() === oldStart.getTime()) return

      const optimisticEvents = events?.map((e) =>
        e.id === droppedEvent.id
          ? { ...e, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
          : e,
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
          { optimisticData: optimisticEvents, rollbackOnError: true },
        )
        toast.success('수업 일정이 변경되었습니다')
      } catch (error) {
        const message = error instanceof Error ? error.message : '일정 변경에 실패했습니다'
        toast.error(message)
      }
    },
    [allDays, events, mutate],
  )

  const onDragCancel = useCallback(() => {
    setActiveEvent(null)
    setOverCellId(null)
  }, [])

  return {
    sensors,
    activeEvent,
    dragConflictCellId,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  }
}
