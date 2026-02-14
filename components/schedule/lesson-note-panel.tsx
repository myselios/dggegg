'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { getLessonNote, upsertLessonNote, getPreviousLessonNote } from '@/app/actions/lesson-notes'
import { createScoreRecord } from '@/app/actions/scores'
import { updateScheduleEvent } from '@/app/actions/schedule'
import type { ScheduleEventWithStudent, LessonNote } from '@/lib/types/database'

const ASSESSMENT_TYPES = ['IO mock', 'Writing', 'Listening', 'Reading', 'Quiz', 'Exam'] as const

export function LessonNotePanel({
  event,
  onClose,
  onUpdated,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClose: () => void
  readonly onUpdated: () => void
}) {
  const [existingNote, setExistingNote] = useState<LessonNote | null>(null)
  const [previousNote, setPreviousNote] = useState<string | null>(null)
  const [showScore, setShowScore] = useState(false)

  useEffect(() => {
    getLessonNote(event.id).then(setExistingNote)
    getPreviousLessonNote(event.student_id, event.start_at).then((note) => {
      if (note) setPreviousNote(note.content ?? null)
    })
  }, [event.id, event.student_id, event.start_at])

  async function handleSave(formData: FormData) {
    const noteResult = await upsertLessonNote({
      event_id: event.id,
      student_id: event.student_id,
      content: formData.get('content') as string,
      homework: (formData.get('homework') as string) || null,
      next_goal: (formData.get('next_goal') as string) || null,
    })
    if (!noteResult.success) {
      alert(noteResult.error)
      return
    }

    const statusResult = await updateScheduleEvent(event.id, { status: 'completed' })
    if (!statusResult.success) {
      alert(statusResult.error)
      return
    }

    if (showScore) {
      const assessmentType = formData.get('assessment_type') as string
      const score = Number(formData.get('score'))
      if (assessmentType && score) {
        const scoreResult = await createScoreRecord({
          student_id: event.student_id,
          event_id: event.id,
          assessment_type: assessmentType,
          score,
          max_score: 7,
          comment: (formData.get('score_comment') as string) || null,
          date: format(new Date(event.start_at), 'yyyy-MM-dd'),
        })
        if (!scoreResult.success) {
          alert(scoreResult.error)
          return
        }
      }
    }

    onUpdated()
  }

  async function handleCancel() {
    const result = await updateScheduleEvent(event.id, { status: 'cancelled' })
    if (!result.success) {
      alert(result.error)
      return
    }
    onUpdated()
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {event.students?.name_ko}
            <Badge variant="outline">{event.template_type ?? '일반'}</Badge>
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(event.start_at), 'M월 d일 (EEE) HH:mm', { locale: ko })}
            {' - '}
            {format(new Date(event.end_at), 'HH:mm')}
          </p>
        </SheetHeader>

        {previousNote && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">이전 수업 메모</p>
            <p className="mt-1 text-sm">{previousNote}</p>
          </div>
        )}

        <Separator className="my-4" />

        <form action={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>오늘 한 것 *</Label>
            <Textarea
              name="content"
              placeholder="오늘 수업 내용..."
              defaultValue={existingNote?.content ?? ''}
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>숙제</Label>
            <Textarea
              name="homework"
              placeholder="숙제 내용..."
              defaultValue={existingNote?.homework ?? ''}
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>다음 목표</Label>
            <Textarea
              name="next_goal"
              placeholder="다음 수업 목표..."
              defaultValue={existingNote?.next_goal ?? ''}
              rows={2}
            />
          </div>

          <Separator />
          <Button type="button" variant="outline" size="sm" onClick={() => setShowScore(!showScore)}>
            {showScore ? '성적 기록 숨기기' : '+ 성적 기록 추가'}
          </Button>

          {showScore && (
            <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
              <div className="flex flex-col gap-2">
                <Label>평가 유형</Label>
                <Select name="assessment_type">
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>점수 (0-7)</Label>
                <Input name="score" type="number" min={0} max={7} step={0.5} />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label>코멘트</Label>
                <Input name="score_comment" placeholder="선택 사항" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">완료 (기록 저장)</Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleCancel}>
              수업 취소
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
