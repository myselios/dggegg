'use client'

import { useMemo } from 'react'
import { endOfDay, endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import {
  buildDailyData,
  buildWeeklyData,
  computeSummary,
  filterLessons,
  type DayPoint,
  type Summary,
  type WeekPoint,
} from '@/lib/utils/lesson-stats'

interface LessonStatsResult {
  readonly summary: Summary
  readonly weeklyData: readonly WeekPoint[]
  readonly dailyData: readonly DayPoint[]
  readonly thisWeekLabel: string
  readonly lastWeekLabel: string
}

/**
 * One wide fetch (last 8 weeks → today) + memoized aggregations for the
 * dashboard's lesson-stats card.
 */
export function useLessonStats(): LessonStatsResult {
  const today = useMemo(() => new Date(), [])

  const thisWeekStart = useMemo(
    () => startOfWeek(today, { weekStartsOn: 1 }),
    [today],
  )
  const thisWeekEnd = useMemo(
    () => endOfWeek(today, { weekStartsOn: 1 }),
    [today],
  )

  const lastWeekStart = useMemo(
    () => startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
    [today],
  )
  const lastWeekEnd = useMemo(
    () => endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
    [today],
  )

  const fetchStart = useMemo(
    () => startOfWeek(subWeeks(today, 8), { weekStartsOn: 1 }).toISOString(),
    [today],
  )
  const fetchEnd = useMemo(() => endOfDay(today).toISOString(), [today])

  const { data: events } = useScheduleEvents(fetchStart, fetchEnd)

  const lessons = useMemo(() => filterLessons(events ?? []), [events])
  const summary = useMemo(
    () => computeSummary(lessons, today, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd),
    [lessons, today, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd],
  )
  const weeklyData = useMemo(() => buildWeeklyData(lessons, today), [lessons, today])
  const dailyData = useMemo(
    () => buildDailyData(lessons, lastWeekStart),
    [lessons, lastWeekStart],
  )
  const thisWeekLabel = `${format(thisWeekStart, 'M/d')} ~ ${format(thisWeekEnd, 'M/d')}`
  const lastWeekLabel = `${format(lastWeekStart, 'M/d')} ~ ${format(lastWeekEnd, 'M/d')}`

  return { summary, weeklyData, dailyData, thisWeekLabel, lastWeekLabel }
}
