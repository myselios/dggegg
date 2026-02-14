'use client'

import { useEffect, useState } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

export function TodayLessons() {
  const [events, setEvents] = useState<ScheduleEventWithStudent[]>([])

  useEffect(() => {
    const supabase = createClient()
    const today = new Date()
    supabase
      .from('schedule_events')
      .select('*, students(id, name_ko, name_en, school, ib_course)')
      .gte('start_at', startOfDay(today).toISOString())
      .lte('start_at', endOfDay(today).toISOString())
      .order('start_at')
      .then(({ data }) => {
        if (data) setEvents(data as ScheduleEventWithStudent[])
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 수업</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">오늘 예정된 수업이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <span className="font-medium">{event.students?.name_ko}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {format(new Date(event.start_at), 'HH:mm')} - {format(new Date(event.end_at), 'HH:mm')}
                  </span>
                </div>
                <Badge variant={event.status === 'completed' ? 'default' : 'outline'}>
                  {event.status === 'scheduled' ? '예정' : event.status === 'completed' ? '완료' : event.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
