'use client'

import React, { useMemo } from 'react'
import { isToday, isSameDay, format, startOfWeek, endOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getWeeksInRange, formatDateFull } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

type DayEventCounts = {
  readonly completed: number
  readonly scheduled: number
  readonly total: number
}

function getEventCountsForDay(
  events: ReadonlyArray<ScheduleEventWithStudent> | undefined,
  day: Date
): DayEventCounts {
  if (!events) return { completed: 0, scheduled: 0, total: 0 }

  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), day))
  const completed = dayEvents.filter((e) => e.status === 'completed').length
  const scheduled = dayEvents.filter((e) => e.status === 'scheduled').length

  return { completed, scheduled, total: dayEvents.length }
}

export function MiniCalendar() {
  const router = useRouter()
  const { start, end } = useMemo(() => getThreeWeekRange(), [])
  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])

  const { data: events } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

  const todayStats = useMemo(() => {
    const today = new Date()
    return getEventCountsForDay(events, today)
  }, [events])

  const thisWeekStats = useMemo(() => {
    if (!events) return { total: 0, completed: 0 }

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const weekEvents = events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return eventDate >= weekStart && eventDate <= weekEnd
    })

    return {
      total: weekEvents.length,
      completed: weekEvents.filter((e) => e.status === 'completed').length
    }
  }, [events])

  const weekTotals = useMemo(() => {
    return weeks.map((week) => {
      if (!events) return 0
      return events.filter((e) => {
        const eventDate = new Date(e.start_at)
        return week.some((day) => isSameDay(eventDate, day))
      }).length
    })
  }, [weeks, events])

  function handleDayClick(day: Date) {
    router.push(`/schedule?date=${formatDateFull(day)}`)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          3주 캘린더
          <Link
            href="/schedule"
            className="ml-auto text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
          >
            전체 보기 &rarr;
          </Link>
        </CardTitle>
        <div className="pt-2 text-xs text-muted-foreground flex items-center gap-3">
          <span>
            오늘: <span className="font-medium text-emerald-600 dark:text-emerald-400">{todayStats.completed}</span>
            <span className="text-muted-foreground/70">/</span>
            <span className="font-medium">{todayStats.total}건 완료</span>
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span>
            이번 주: <span className="font-medium">{thisWeekStats.total}건</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week range labels */}
        <div className="mb-3 flex gap-1 text-[10px] text-muted-foreground">
          {weeks.map((week, i) => (
            <span key={i} className="flex-1 text-center">
              {format(week[0], 'M/d', { locale: ko })}~{format(week[6], 'M/d', { locale: ko })}
            </span>
          ))}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-[repeat(21,1fr)_auto] gap-px mb-1">
          {weeks.map((_, weekIdx) =>
            WEEKDAYS.map((day, dayIdx) => (
              <div
                key={`header-${weekIdx}-${dayIdx}`}
                className={cn(
                  'text-center text-[10px] font-medium text-muted-foreground',
                  dayIdx === 5 && 'text-blue-500 dark:text-blue-400',
                  dayIdx === 6 && 'text-red-500 dark:text-red-400'
                )}
              >
                {weekIdx === 0 ? day : ''}
              </div>
            ))
          )}
          <div className="w-10" />
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-[repeat(21,1fr)_auto] gap-px">
          {weeks.map((week, weekIdx) => (
            <React.Fragment key={weekIdx}>
              {week.map((day, dayIdx) => {
                const counts = getEventCountsForDay(events, day)
                const today = isToday(day)
                const hasEvents = counts.total > 0

                const tooltipText = hasEvents
                  ? `${format(day, 'M월 d일 (E)', { locale: ko })}\n완료: ${counts.completed}건 | 예정: ${counts.scheduled}건`
                  : undefined

                return (
                  <button
                    key={`${weekIdx}-${dayIdx}`}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    title={tooltipText}
                    className={cn(
                      'relative flex flex-col items-center gap-0.5 rounded-md py-1 transition-colors hover:bg-accent/50 cursor-pointer',
                      today && 'bg-primary/10 ring-1 ring-primary/30',
                      weekIdx > 0 && dayIdx === 0 && 'ml-0.5'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] leading-none tabular-nums',
                        today && 'font-bold text-primary',
                        !today && dayIdx === 5 && 'text-blue-500 dark:text-blue-400',
                        !today && dayIdx === 6 && 'text-red-500 dark:text-red-400',
                        !today && dayIdx < 5 && 'text-foreground/70'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {/* Progress bar */}
                    {hasEvents && (
                      <div className="mt-0.5 flex gap-px h-1 w-full px-0.5">
                        {counts.completed > 0 && (
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ flex: counts.completed }}
                          />
                        )}
                        {counts.scheduled > 0 && (
                          <div
                            className="h-full rounded-full bg-blue-400"
                            style={{ flex: counts.scheduled }}
                          />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
              <div className="flex items-center justify-center px-2">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {weekTotals[weekIdx]}건
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
