'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'
import { useStudents } from '@/lib/hooks/use-students'
import { createScheduleEvent, createRecurringEvents } from '@/app/actions/schedule'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatTime } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const TEMPLATE_TYPES = ['IO', 'Writing', 'Reading', 'Listening', 'Speaking'] as const

function findConflicts(
  date: Date,
  startHour: number,
  durationMinutes: number,
  existingEvents: readonly ScheduleEventWithStudent[]
): readonly ScheduleEventWithStudent[] {
  const newStart = new Date(date)
  newStart.setHours(startHour, 0, 0, 0)
  const newEnd = new Date(newStart)
  newEnd.setMinutes(newEnd.getMinutes() + durationMinutes)

  return existingEvents.filter((e) => {
    if (e.status === 'cancelled') return false
    const eStart = new Date(e.start_at)
    const eEnd = new Date(e.end_at)
    return eStart < newEnd && newStart < eEnd
  })
}

export function EventCreateDialog({
  date,
  hour,
  existingEvents,
  onClose,
  onCreated,
}: {
  readonly date: Date
  readonly hour: number
  readonly existingEvents: readonly ScheduleEventWithStudent[]
  readonly onClose: () => void
  readonly onCreated: () => void
}) {
  const { data: students } = useStudents()
  const activeStudents = students?.filter((s) => s.status === 'active') ?? []

  const [startHour, setStartHour] = useState(hour)
  const [duration, setDuration] = useState(60)

  const conflicts = useMemo(
    () => findConflicts(date, startHour, duration, existingEvents),
    [date, startHour, duration, existingEvents]
  )

  async function handleSubmit(formData: FormData) {
    const studentId = formData.get('student_id') as string
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
      const result = await createRecurringEvents(baseEvent, repeatWeeks)
      if (!result.success) {
        alert(result.error)
        return
      }
    } else {
      const result = await createScheduleEvent(baseEvent)
      if (!result.success) {
        alert(result.error)
        return
      }
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
              <Input
                name="start_hour"
                type="number"
                min={8}
                max={22}
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>수업 시간 (분)</Label>
              <Input
                name="duration"
                type="number"
                min={30}
                step={30}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/50">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  시간 충돌 ({conflicts.length}건)
                </span>
                {conflicts.map((c) => (
                  <span key={c.id} className="text-amber-700 dark:text-amber-400">
                    {c.students?.name_ko} {formatTime(c.start_at)}-{formatTime(c.end_at)}
                  </span>
                ))}
              </div>
            </div>
          )}

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
