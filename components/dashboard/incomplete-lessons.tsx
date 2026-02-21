'use client'

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type IncompleteEvent = {
  readonly id: string
  readonly start_at: string
  readonly students: { readonly name_ko: string }
}

export function IncompleteLessons() {
  const [events, setEvents] = useState<IncompleteEvent[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('schedule_events')
      .select('id, start_at, students(name_ko)')
      .eq('status', 'scheduled')
      .lt('start_at', new Date().toISOString())
      .gte('start_at', subDays(new Date(), 7).toISOString())
      .order('start_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data as unknown as IncompleteEvent[])
      })
  }, [])

  if (events.length === 0) return null

  return (
    <Card className={cn(
      'border-amber-200 bg-amber-50/50',
      'dark:border-amber-800 dark:bg-amber-950/20'
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-700 dark:text-amber-400">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
            <AlertTriangle className="size-4" />
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
            <Link
              key={event.id}
              href="/schedule"
              className={cn(
                'group flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3',
                'transition-all hover:border-amber-300 hover:shadow-sm',
                'dark:border-amber-800 dark:bg-amber-950/30 dark:hover:border-amber-700'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {event.students.name_ko}
                  </span>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(event.start_at), 'M/d (EEE) HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
