'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Check, NotebookPen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateScheduleEvent } from '@/app/actions/schedule'
import { upsertLessonNote } from '@/app/actions/lesson-notes'
import { createScoreRecord } from '@/app/actions/scores'
import { cn } from '@/lib/utils'

const ASSESSMENT_TYPES = ['IO mock', 'Writing', 'Listening', 'Reading', 'Quiz', 'Exam'] as const

export type QuickCompleteEvent = {
  readonly id: string
  readonly student_id: string | null
  readonly start_at: string
  readonly status: string
}

function useQuickComplete(event: QuickCompleteEvent, onUpdated: () => void) {
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleQuickComplete() {
    setIsPending(true)
    const result = await updateScheduleEvent(event.id, { status: 'completed' })
    setIsPending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('수업이 완료 처리되었습니다')
    onUpdated()
  }

  async function handleSaveWithNote(formData: FormData) {
    if (!event.student_id) {
      toast.error('개인 메모에는 수업 노트를 작성할 수 없습니다')
      return
    }

    setIsPending(true)
    const saved = await saveNoteAndComplete(event, event.student_id, formData)
    setIsPending(false)

    if (!saved.success) {
      toast.error(saved.error)
      return
    }
    setIsNoteOpen(false)
    toast.success('수업 노트와 함께 완료 처리되었습니다')
    onUpdated()
  }

  return { isNoteOpen, setIsNoteOpen, isPending, handleQuickComplete, handleSaveWithNote }
}

async function saveNoteAndComplete(
  event: QuickCompleteEvent,
  studentId: string,
  formData: FormData
): Promise<{ readonly success: true } | { readonly success: false; readonly error: string }> {
  const noteResult = await upsertLessonNote({
    event_id: event.id,
    student_id: studentId,
    content: formData.get('content') as string,
    homework: (formData.get('homework') as string) || null,
    next_goal: (formData.get('next_goal') as string) || null,
  })
  if (!noteResult.success) return { success: false, error: noteResult.error }

  const statusResult = await updateScheduleEvent(event.id, { status: 'completed' })
  if (!statusResult.success) return { success: false, error: statusResult.error }

  const assessmentType = formData.get('assessment_type') as string
  const score = Number(formData.get('score'))
  if (assessmentType && score) {
    const scoreResult = await createScoreRecord({
      student_id: studentId,
      event_id: event.id,
      assessment_type: assessmentType,
      score,
      max_score: 7,
      comment: (formData.get('score_comment') as string) || null,
      date: format(new Date(event.start_at), 'yyyy-MM-dd'),
    })
    if (!scoreResult.success) return { success: false, error: scoreResult.error }
  }

  return { success: true }
}

function QuickCompleteDone() {
  return (
    <div
      data-testid="quick-complete-done"
      className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
    >
      <Check className="size-4" />
    </div>
  )
}

function QuickCompleteActions({
  isPending,
  isNoteOpen,
  onComplete,
  onToggleNote,
}: {
  readonly isPending: boolean
  readonly isNoteOpen: boolean
  readonly onComplete: () => void
  readonly onToggleNote: () => void
}) {
  return (
    <div className="flex shrink-0 gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={onComplete}
        data-testid="quick-complete-button"
        className="h-11 min-w-11 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
      >
        <Check className="size-4" />
        완료
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={onToggleNote}
        data-testid="quick-complete-note-toggle"
        className="h-11 min-w-11 gap-1"
      >
        {isNoteOpen ? <X className="size-4" /> : <NotebookPen className="size-4" />}
        {isNoteOpen ? '취소' : '+노트'}
      </Button>
    </div>
  )
}

function QuickNoteForm({
  isPending,
  onSubmit,
}: {
  readonly isPending: boolean
  readonly onSubmit: (formData: FormData) => void
}) {
  const [showScore, setShowScore] = useState(false)

  return (
    <form
      action={onSubmit}
      data-testid="quick-complete-note-form"
      className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">오늘 한 것 *</Label>
        <Textarea name="content" placeholder="오늘 수업 내용..." rows={2} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">숙제</Label>
        <Textarea name="homework" placeholder="숙제 내용..." rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">다음 목표</Label>
        <Textarea name="next_goal" placeholder="다음 수업 목표..." rows={2} />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11"
        onClick={() => setShowScore((prev) => !prev)}
      >
        {showScore ? '성적 기록 숨기기' : '+ 성적 기록 추가'}
      </Button>

      {showScore && (
        <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">평가 유형</Label>
            <Select name="assessment_type">
              <SelectTrigger className="h-11"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">점수 (0-7)</Label>
            <Input name="score" type="number" min={0} max={7} step={0.5} className="h-11" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs">코멘트</Label>
            <Input name="score_comment" placeholder="선택 사항" className="h-11" />
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        data-testid="quick-complete-note-submit"
        className={cn('h-11')}
      >
        저장하며 완료
      </Button>
    </form>
  )
}

export function QuickComplete({
  event,
  onUpdated,
}: {
  readonly event: QuickCompleteEvent
  readonly onUpdated: () => void
}) {
  const { isNoteOpen, setIsNoteOpen, isPending, handleQuickComplete, handleSaveWithNote } =
    useQuickComplete(event, onUpdated)

  if (event.status === 'completed') {
    return (
      <div className="flex justify-end">
        <QuickCompleteDone />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2" data-testid="quick-complete">
      <div className="flex justify-end">
        <QuickCompleteActions
          isPending={isPending}
          isNoteOpen={isNoteOpen}
          onComplete={handleQuickComplete}
          onToggleNote={() => setIsNoteOpen((prev) => !prev)}
        />
      </div>
      {isNoteOpen && <QuickNoteForm isPending={isPending} onSubmit={handleSaveWithNote} />}
    </div>
  )
}
