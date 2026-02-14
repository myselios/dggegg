'use client'

import { useMemo } from 'react'
import { isToday, isSameDay, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getWeeksInRange, formatDateFull } from '@/lib/utils/date'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

function countEventsForDay(
  events: ReadonlyArray<{ readonly start_at: string }> | undefined,
  day: Date
): number {
  if (!events) return 0
  return events.filter((e) => isSameDay(new Date(e.start_at), day)).length
}

export function MiniCalendar() {
  const router = useRouter()
  const { start, end } = useMemo(() => getThreeWeekRange(), [])
  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])

  const { data: events } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

  function handleDayClick(day: Date) {
    router.push(`/schedule?date=${formatDateFull(day)}`)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
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
        <div className="grid grid-cols-[repeat(21,1fr)] gap-px mb-1">
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
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-[repeat(21,1fr)] gap-px">
          {weeks.flatMap((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const count = countEventsForDay(events, day)
              const today = isToday(day)

              return (
                <button
                  key={`${weekIdx}-${dayIdx}`}
                  type="button"
                  onClick={() => handleDayClick(day)}
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
                  {/* Event dots */}
                  {count > 0 && (
                    <div className="flex items-center gap-px">
                      {count <= 3 ? (
                        Array.from({ length: count }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 w-1 rounded-full',
                              today
                                ? 'bg-primary'
                                : 'bg-emerald-500 dark:bg-emerald-400'
                            )}
                          />
                        ))
                      ) : (
                        <span className={cn(
                          'text-[9px] font-medium leading-none',
                          today
                            ? 'text-primary'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
