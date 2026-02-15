'use client'

import { useEffect, useState } from 'react'
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
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const STATUS_CONFIG = {
  scheduled: {
    label: '예정',
    variant: 'outline' as const,
    className: 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950',
    dotColor: 'bg-blue-500',
    lineColor: 'bg-blue-200 dark:bg-blue-800',
  },
  completed: {
    label: '완료',
    variant: 'default' as const,
    className: 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950',
    dotColor: 'bg-emerald-500',
    lineColor: 'bg-emerald-200 dark:bg-emerald-800',
  },
  cancelled: {
    label: '취소',
    variant: 'destructive' as const,
    className: 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950',
    dotColor: 'bg-red-400',
    lineColor: 'bg-red-200 dark:bg-red-800',
  },
  no_show: {
    label: '미출석',
    variant: 'destructive' as const,
    className: 'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-950',
    dotColor: 'bg-orange-400',
    lineColor: 'bg-orange-200 dark:bg-orange-800',
  },
} as const

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled
}

function StatusIcon({ status }: { readonly status: string }) {
  const className = 'h-3.5 w-3.5'
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

export function TodayLessons() {
  const [events, setEvents] = useState<ScheduleEventWithStudent[]>([])

  useEffect(() => {
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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              오늘 예정된 수업이 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              새 수업을 등록하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col">
            {events.map((event, index) => {
              const config = getStatusConfig(event.status)
              const isLast = index === events.length - 1

              return (
                <div key={event.id} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-background',
                      config.dotColor
                    )} />
                    {!isLast && (
                      <div className={cn(
                        'mt-1 w-0.5 flex-1',
                        config.lineColor
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex flex-1 items-center justify-between rounded-lg border p-3',
                    'transition-colors hover:bg-accent/50',
                    event.status === 'completed' && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                    event.status === 'cancelled' && 'opacity-60'
                  )}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {event.students?.name_ko}
                        </span>
                        {event.students?.ib_course && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {event.students.ib_course}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
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
                      variant={config.variant}
                      className={cn('ml-2 gap-1 shrink-0', config.className)}
                    >
                      <StatusIcon status={event.status} />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
