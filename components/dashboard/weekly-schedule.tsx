'use client'

import { useMemo } from 'react'
import {
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isToday,
  format,
} from 'date-fns'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { formatDateFull } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

type DayData = {
  readonly date: Date
  readonly dayName: string
  readonly dayNumber: string
  readonly isToday: boolean
  readonly isSaturday: boolean
  readonly isSunday: boolean
  readonly events: ReadonlyArray<ScheduleEventWithStudent>
}

function buildDays(
  weekStart: Date,
  events: ReadonlyArray<ScheduleEventWithStudent> | undefined
): ReadonlyArray<DayData> {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dayEvents = (events ?? [])
      .filter((e) => isSameDay(new Date(e.start_at), date))
      .toSorted(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )

    return {
      date,
      dayName: WEEKDAYS[i],
      dayNumber: format(date, 'd'),
      isToday: isToday(date),
      isSaturday: i === 5,
      isSunday: i === 6,
      events: dayEvents,
    }
  })
}

function computeStats(events: ReadonlyArray<ScheduleEventWithStudent> | undefined) {
  if (!events) return { total: 0, completed: 0, scheduled: 0 }
  return {
    total: events.length,
    completed: events.filter((e) => e.status === 'completed').length,
    scheduled: events.filter((e) => e.status === 'scheduled').length,
  }
}

function DayColumn({
  day,
  onClick,
}: {
  readonly day: DayData
  readonly onClick: (date: Date) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(day.date)}
      className={cn(
        'relative flex flex-col rounded-xl p-2.5 text-left transition-all min-h-[80px]',
        'hover:bg-accent/50 hover:shadow-sm cursor-pointer',
        day.isToday && 'bg-primary/5 ring-1 ring-primary/20'
      )}
    >
      {day.isToday && (
        <div className="absolute top-0 left-2.5 right-2.5 h-0.5 rounded-full bg-primary" />
      )}

      <div className="flex items-center gap-1 mb-2">
        <span
          className={cn(
            'text-sm font-semibold',
            day.isToday && 'text-primary',
            !day.isToday && day.isSaturday && 'text-blue-500 dark:text-blue-400',
            !day.isToday && day.isSunday && 'text-red-500 dark:text-red-400',
            !day.isToday && !day.isSaturday && !day.isSunday && 'text-foreground/80'
          )}
        >
          {day.dayName}
        </span>
        <span
          className={cn(
            'text-xs tabular-nums',
            day.isToday ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {day.dayNumber}
        </span>
        {day.events.length > 0 && (
          <span
            className={cn(
              'ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              day.isToday
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {day.events.length}
          </span>
        )}
      </div>

      {day.events.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {day.events.map((event) => (
            <div key={event.id} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: event.color ?? '#94a3b8' }}
              />
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {format(new Date(event.start_at), 'HH:mm')}
              </span>
              <span className="text-xs font-medium truncate">
                {event.students?.name_ko}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/40">—</span>
      )}
    </button>
  )
}

export function WeeklySchedule() {
  const router = useRouter()

  const { weekStart, weekEnd } = useMemo(() => {
    const today = new Date()
    return {
      weekStart: startOfWeek(today, { weekStartsOn: 1 }),
      weekEnd: endOfWeek(today, { weekStartsOn: 1 }),
    }
  }, [])

  const { data: events } = useScheduleEvents(
    weekStart.toISOString(),
    weekEnd.toISOString()
  )

  const days = useMemo(() => buildDays(weekStart, events), [weekStart, events])
  const stats = useMemo(() => computeStats(events), [events])

  function handleDayClick(date: Date) {
    router.push(`/schedule?date=${formatDateFull(date)}`)
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
            <CalendarDays className="size-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          이번 주 스케줄
          <Link
            href="/schedule"
            className="ml-auto text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
          >
            전체 보기 &rarr;
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mon-Thu */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {days.slice(0, 4).map((day) => (
            <DayColumn key={day.dayName} day={day} onClick={handleDayClick} />
          ))}
        </div>

        {/* Fri-Sun */}
        <div className="grid grid-cols-4 gap-2">
          {days.slice(4).map((day) => (
            <DayColumn key={day.dayName} day={day} onClick={handleDayClick} />
          ))}
          <div />
        </div>

        {/* Footer Summary */}
        {stats.total > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              총{' '}
              <span className="font-medium text-foreground">{stats.total}</span>
              건
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              완료 {stats.completed}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              예정 {stats.scheduled}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
