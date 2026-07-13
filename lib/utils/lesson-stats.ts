import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

export type WeekPoint = { readonly week: string; readonly hours: number }
export type DayPoint = { readonly day: string; readonly hours: number }

export type Summary = {
  readonly lastWeekHours: number
  readonly lastWeekCount: number
  readonly prevWeekHours: number
  readonly thisMonthHours: number
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

export function calcHours(startAt: string, endAt: string): number {
  return (new Date(endAt).getTime() - new Date(startAt).getTime()) / 3_600_000
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function filterLessons(
  events: readonly ScheduleEventWithStudent[],
): readonly ScheduleEventWithStudent[] {
  return events.filter((e) => e.event_type === 'lesson' && e.status === 'completed')
}

export function buildWeeklyData(
  lessons: readonly ScheduleEventWithStudent[],
  today: Date,
): readonly WeekPoint[] {
  return Array.from({ length: 8 }, (_, i) => {
    const offset = 8 - i
    const wStart = startOfWeek(subWeeks(today, offset), { weekStartsOn: 1 })
    const wEnd = endOfWeek(subWeeks(today, offset), { weekStartsOn: 1 })
    const hours = lessons
      .filter((e) => {
        const d = new Date(e.start_at)
        return d >= wStart && d <= wEnd
      })
      .reduce((sum, e) => sum + calcHours(e.start_at, e.end_at), 0)
    return { week: format(wStart, 'M/d', { locale: ko }), hours: round1(hours) }
  })
}

export function buildDailyData(
  lessons: readonly ScheduleEventWithStudent[],
  lastWeekStart: Date,
): readonly DayPoint[] {
  return WEEKDAYS.map((label, i) => {
    const date = addDays(lastWeekStart, i)
    const hours = lessons
      .filter((e) => isSameDay(new Date(e.start_at), date))
      .reduce((sum, e) => sum + calcHours(e.start_at, e.end_at), 0)
    return { day: label, hours: round1(hours) }
  })
}

export function computeSummary(
  lessons: readonly ScheduleEventWithStudent[],
  today: Date,
  lastWeekStart: Date,
  lastWeekEnd: Date,
): Summary {
  const prevWeekStart = startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(subWeeks(today, 2), { weekStartsOn: 1 })
  const thisMonthStart = startOfMonth(today)

  let lastWeekHours = 0
  let lastWeekCount = 0
  let prevWeekHours = 0
  let thisMonthHours = 0

  for (const e of lessons) {
    const d = new Date(e.start_at)
    const h = calcHours(e.start_at, e.end_at)
    if (d >= lastWeekStart && d <= lastWeekEnd) {
      lastWeekHours += h
      lastWeekCount += 1
    }
    if (d >= prevWeekStart && d <= prevWeekEnd) {
      prevWeekHours += h
    }
    if (d >= thisMonthStart) {
      thisMonthHours += h
    }
  }

  return {
    lastWeekHours: round1(lastWeekHours),
    lastWeekCount,
    prevWeekHours: round1(prevWeekHours),
    thisMonthHours: round1(thisMonthHours),
  }
}
