'use client'

import { useCallback, useEffect, useState } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import {
  Clock,
  CalendarCheck,
  CalendarX,
  CircleDot,
  CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getScheduleStatus } from '@/lib/constants/status-styles'
import { QuickComplete } from '@/components/dashboard/quick-complete'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

function StatusIcon({ status }: { readonly status: string }) {
  const className = 'size-3.5'
  switch (status) {
    case 'completed':
      return <CalendarCheck className={className} />
    case 'cancelled':
      return <CalendarX className={className} />
    case 'no_show':
      return <CircleDot className={className} />
    default:
      return <Clock className={className} />
  }
}

function LessonProgressSummary({
  events,
}: {
  readonly events: ReadonlyArray<ScheduleEventWithStudent>
}) {
  const total = events.length
  const completedCount = events.filter((e) => e.status === 'completed').length
  const remaining = total - completedCount
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div className="mb-5 flex items-center gap-3">
      <p className="shrink-0 text-sm">
        <span className="text-base font-bold tabular-nums text-foreground">
          {remaining}
        </span>
        <span className="ml-1 text-muted-foreground">개 남음</span>
      </p>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
        {progressPct}%
      </span>
    </div>
  )
}

export function TodayLessons() {
  const [events, setEvents] = useState<ScheduleEventWithStudent[]>([])

  const fetchEvents = useCallback(() => {
    const supabase = createClient()
    const today = new Date()
    supabase
      .from('schedule_events')
      .select('*, students(id, name_ko, school, ib_course)')
      .gte('start_at', startOfDay(today).toISOString())
      .lte('start_at', endOfDay(today).toISOString())
      .order('start_at')
      .then(({ data }) => {
        if (data) setEvents(data as ScheduleEventWithStudent[])
      })
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <Card className="glass-card rounded-2xl border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <CalendarDays className="size-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          오늘 수업
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs font-normal">
              {events.length}건
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              오늘 예정된 수업이 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              새 수업을 등록하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <>
            <LessonProgressSummary events={events} />
            <div className="relative flex flex-col">
            {events.map((event, index) => {
              const config = getScheduleStatus(event.status)
              const isLast = index === events.length - 1

              return (
                <div key={event.id} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-background',
                      config.dot
                    )} />
                    {!isLast && (
                      <div className={cn(
                        'mt-1 w-0.5 flex-1',
                        config.line
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    data-testid="today-lesson-card"
                    data-event-id={event.id}
                    className={cn(
                      'flex flex-1 flex-col gap-2 rounded-lg border p-3',
                      'transition-colors hover:bg-accent/50',
                      event.status === 'completed' && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                      event.status === 'cancelled' && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">
                            {event.students?.name_ko}
                          </span>
                          {event.students?.ib_course && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {event.students.ib_course}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span className="tabular-nums">
                            {format(new Date(event.start_at), 'HH:mm')}
                          </span>
                          <span className="text-muted-foreground/40">-</span>
                          <span className="tabular-nums">
                            {format(new Date(event.end_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('ml-2 gap-1 shrink-0', config.badge)}
                      >
                        <StatusIcon status={event.status} />
                        {config.label}
                      </Badge>
                    </div>
                    {event.event_type === 'lesson' &&
                      (event.status === 'scheduled' || event.status === 'completed') && (
                        <QuickComplete event={event} onUpdated={fetchEvents} />
                      )}
                  </div>
                </div>
              )
            })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
