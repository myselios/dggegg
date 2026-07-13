'use client'

import { useCallback, useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QuickComplete } from '@/components/dashboard/quick-complete'

type IncompleteEvent = {
  readonly id: string
  readonly start_at: string
  readonly status: string
  readonly student_id: string | null
  readonly event_type: 'lesson' | 'memo'
  readonly students: { readonly name_ko: string } | null
}

export function IncompleteLessons() {
  const [events, setEvents] = useState<IncompleteEvent[]>([])

  const fetchEvents = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('schedule_events')
      .select('id, start_at, status, student_id, event_type, students(name_ko)')
      .eq('status', 'scheduled')
      .lt('start_at', new Date().toISOString())
      .gte('start_at', subDays(new Date(), 7).toISOString())
      .order('start_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data as unknown as IncompleteEvent[])
      })
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  if (events.length === 0) return null

  return (
    <Card className={cn(
      'glass-card rounded-2xl border-none',
      'bg-amber-50/50 dark:bg-amber-950/20'
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
            <AlertTriangle className="size-3.5" />
          </div>
          미완료 수업
          <Badge
            variant="outline"
            className="ml-auto border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-300"
          >
            {events.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <div
              key={event.id}
              data-testid="incomplete-lesson-card"
              data-event-id={event.id}
              className={cn(
                'group flex flex-col gap-2 rounded-lg border border-amber-200 bg-white p-3',
                'transition-all hover:border-amber-300 hover:shadow-sm',
                'dark:border-amber-800 dark:bg-amber-950/30 dark:hover:border-amber-700'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Link href="/schedule" className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold">
                      {event.students?.name_ko}
                    </span>
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">
                      {format(new Date(event.start_at), 'M/d (EEE) HH:mm', { locale: ko })}
                    </p>
                  </div>
                </Link>
                <Link
                  href="/schedule"
                  aria-label="일정으로 이동"
                  className="flex size-11 shrink-0 items-center justify-center"
                >
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              {event.event_type === 'lesson' && (
                <QuickComplete
                  event={{
                    id: event.id,
                    student_id: event.student_id,
                    start_at: event.start_at,
                    status: event.status,
                  }}
                  onUpdated={fetchEvents}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
