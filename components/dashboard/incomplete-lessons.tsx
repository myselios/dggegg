'use client'

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card className="border-yellow-300">
      <CardHeader>
        <CardTitle className="text-yellow-700">미완료 수업 ({events.length}건)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <Link key={event.id} href="/schedule" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
              <span className="text-sm font-medium">{event.students.name_ko}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.start_at), 'M/d HH:mm', { locale: ko })}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
