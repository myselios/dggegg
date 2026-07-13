'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Enrollment } from '@/lib/types/database'

export type EnrollmentFormFields = {
  readonly start_date: string
  readonly end_date: string | null
  readonly sessions_per_week: number | null
  readonly lesson_type: string
  readonly notes: string | null
  readonly total_sessions: number | null
  readonly payment_note: string | null
}

export function parseEnrollmentFormData(formData: FormData): EnrollmentFormFields {
  const unlimited = formData.get('unlimited') === 'on'
  const totalSessionsRaw = formData.get('total_sessions') as string | null
  const sessionsPerWeekRaw = formData.get('sessions_per_week') as string | null
  const paymentNote = ((formData.get('payment_note') as string) ?? '').trim() || null

  return {
    start_date: formData.get('start_date') as string,
    end_date: null,
    sessions_per_week: sessionsPerWeekRaw ? Number(sessionsPerWeekRaw) : null,
    lesson_type: ((formData.get('lesson_type') as string) || '1:1').trim(),
    notes: null,
    total_sessions: unlimited || !totalSessionsRaw ? null : Number(totalSessionsRaw),
    payment_note: paymentNote,
  }
}

type EnrollmentFormDefaults = Pick<
  Enrollment,
  'start_date' | 'total_sessions' | 'sessions_per_week' | 'lesson_type' | 'payment_note'
>

type Props = {
  readonly defaultValues?: EnrollmentFormDefaults
  readonly onSubmit: (formData: FormData) => void | Promise<void>
  readonly onCancel: () => void
  readonly submitting?: boolean
  readonly submitLabel?: string
}

export function EnrollmentForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = '저장',
}: Props) {
  const [unlimited, setUnlimited] = useState(defaultValues?.total_sessions === null)

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData)
      }}
      className="flex flex-col gap-4"
      data-testid="enrollment-form"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>시작일 *</Label>
          <Input
            type="date"
            name="start_date"
            required
            defaultValue={defaultValues?.start_date ?? format(new Date(), 'yyyy-MM-dd')}
            data-testid="enrollment-start-date"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>주당 횟수</Label>
          <Input
            type="number"
            name="sessions_per_week"
            min={1}
            max={14}
            placeholder="예: 2"
            defaultValue={defaultValues?.sessions_per_week ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>패키지 회차</Label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="unlimited"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="size-3.5 rounded border-input"
                data-testid="enrollment-unlimited-checkbox"
              />
              무제한
            </label>
          </div>
          <Input
            type="number"
            name="total_sessions"
            min={1}
            max={200}
            placeholder="예: 8"
            disabled={unlimited}
            defaultValue={defaultValues?.total_sessions ?? undefined}
            data-testid="enrollment-total-sessions"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>수업 유형</Label>
          <Input
            name="lesson_type"
            placeholder="예: 1:1"
            defaultValue={defaultValues?.lesson_type ?? '1:1'}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>정산 메모</Label>
        <Textarea
          name="payment_note"
          rows={2}
          placeholder="정산 관련 메모 (계좌, 금액 등)"
          defaultValue={defaultValues?.payment_note ?? ''}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting} data-testid="enrollment-form-submit">
          {submitting ? '저장 중...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          취소
        </Button>
      </div>
    </form>
  )
}
