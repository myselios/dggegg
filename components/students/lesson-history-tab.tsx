'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { BookOpen, ClipboardList, Target } from 'lucide-react'
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
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <BookOpen className="size-5 text-muted-foreground/50" />
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">수업 기록이 없습니다</p>
        <p className="mt-1 text-xs text-muted-foreground/60">수업 완료 시 기록이 여기에 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id} className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {format(new Date(lesson.schedule_events.start_at), 'M월 d일 (EEE)', { locale: ko })}
              </span>
              {lesson.schedule_events.template_type && (
                <Badge variant="secondary" className="text-[10px]">{lesson.schedule_events.template_type}</Badge>
              )}
            </div>
            {lesson.content && (
              <div className="mt-3 flex gap-2 text-sm">
                <BookOpen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
                <span>{lesson.content}</span>
              </div>
            )}
            {lesson.homework && (
              <div className="mt-2 flex gap-2 text-sm text-muted-foreground">
                <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-amber-500/60" />
                <span>숙제: {lesson.homework}</span>
              </div>
            )}
            {lesson.next_goal && (
              <div className="mt-2 flex gap-2 text-sm text-muted-foreground">
                <Target className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
                <span>다음 목표: {lesson.next_goal}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
