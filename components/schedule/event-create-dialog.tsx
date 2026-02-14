'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useStudents } from '@/lib/hooks/use-students'
import { createScheduleEvent, createRecurringEvents } from '@/app/actions/schedule'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TEMPLATE_TYPES = ['IO', 'Writing', 'Reading', 'Listening', 'Speaking'] as const

export function EventCreateDialog({
  date,
  hour,
  onClose,
  onCreated,
}: {
  readonly date: Date
  readonly hour: number
  readonly onClose: () => void
  readonly onCreated: () => void
}) {
  const { data: students } = useStudents()
  const activeStudents = students?.filter((s) => s.status === 'active') ?? []

  async function handleSubmit(formData: FormData) {
    const studentId = formData.get('student_id') as string
    const startHour = Number(formData.get('start_hour'))
    const duration = Number(formData.get('duration'))
    const templateType = formData.get('template_type') as string
    const repeatWeeks = Number(formData.get('repeat_weeks')) || 0

    const startAt = new Date(date)
    startAt.setHours(startHour, 0, 0, 0)
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + duration)

    const baseEvent = {
      student_id: studentId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: 'scheduled' as const,
      template_type: templateType || null,
      recurrence_rule: null,
      recurrence_group_id: null,
      color: null,
    }

    if (repeatWeeks > 1) {
      await createRecurringEvents(baseEvent, repeatWeeks)
    } else {
      await createScheduleEvent(baseEvent)
    }
    onCreated()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            수업 추가 - {format(date, 'M월 d일 (EEE)', { locale: ko })}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>학생 *</Label>
            <Select name="student_id" required>
              <SelectTrigger><SelectValue placeholder="학생 선택" /></SelectTrigger>
              <SelectContent>
                {activeStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name_ko} ({s.school})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>시작 시간</Label>
              <Input name="start_hour" type="number" min={8} max={22} defaultValue={hour} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>수업 시간 (분)</Label>
              <Input name="duration" type="number" min={30} step={30} defaultValue={60} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>수업 유형</Label>
            <Select name="template_type">
              <SelectTrigger><SelectValue placeholder="선택 (선택사항)" /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>반복 (주)</Label>
            <Input name="repeat_weeks" type="number" min={0} max={52} defaultValue={0} placeholder="0 = 반복 없음" />
          </div>
          <Button type="submit" className="w-full">수업 추가</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
