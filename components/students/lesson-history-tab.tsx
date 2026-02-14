'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LessonNote, ScheduleEvent } from '@/lib/types/database'

type LessonWithEvent = LessonNote & {
  schedule_events: Pick<ScheduleEvent, 'start_at' | 'template_type' | 'status'>
}

export function LessonHistoryTab({ studentId }: { readonly studentId: string }) {
  const [lessons, setLessons] = useState<LessonWithEvent[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('lesson_notes')
      .select('*, schedule_events(start_at, template_type, status)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setLessons(data as LessonWithEvent[])
      })
  }, [studentId])

  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">수업 기록이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {format(new Date(lesson.schedule_events.start_at), 'M월 d일 (EEE)', { locale: ko })}
              </span>
              {lesson.schedule_events.template_type && (
                <Badge variant="secondary">{lesson.schedule_events.template_type}</Badge>
              )}
            </div>
            {lesson.content && <p className="mt-2 text-sm">{lesson.content}</p>}
            {lesson.homework && (
              <p className="mt-1 text-sm text-muted-foreground">숙제: {lesson.homework}</p>
            )}
            {lesson.next_goal && (
              <p className="mt-1 text-sm text-muted-foreground">다음 목표: {lesson.next_goal}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
