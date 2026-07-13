'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EnrollmentForm, parseEnrollmentFormData, type EnrollmentFormFields } from './enrollment-form'
import type { Enrollment } from '@/lib/types/database'

const ENROLLMENT_STATUS = {
  active: { label: '진행 중', badge: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  paused: { label: '일시 중지', badge: 'border-amber-200 text-amber-700 bg-amber-50' },
  ended: { label: '종료', badge: 'border-gray-200 text-gray-600 bg-gray-50' },
} as const

type PaymentAlertLevel = 'urgent' | 'due' | null

function getPaymentAlertLevel(totalSessions: number | null, completedSessions: number): PaymentAlertLevel {
  if (totalSessions === null) return null
  if (completedSessions >= totalSessions) return 'due'
  if (completedSessions >= totalSessions - 1) return 'urgent'
  return null
}

type Props = {
  readonly enrollment: Enrollment
  readonly completedSessions: number | null
  readonly onUpdate: (id: string, fields: EnrollmentFormFields) => Promise<void>
  readonly onDelete: (id: string) => Promise<void>
}

export function EnrollmentCard({ enrollment, completedSessions, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const statusConfig = ENROLLMENT_STATUS[enrollment.status]
  const alertLevel =
    completedSessions !== null ? getPaymentAlertLevel(enrollment.total_sessions, completedSessions) : null
  const progressPercent =
    completedSessions !== null && enrollment.total_sessions
      ? Math.min(100, Math.round((completedSessions / enrollment.total_sessions) * 100))
      : null

  async function handleUpdateSubmit(formData: FormData) {
    setSaving(true)
    try {
      await onUpdate(enrollment.id, parseEnrollmentFormData(formData))
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteClick() {
    if (!confirm('이 수강권을 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      await onDelete(enrollment.id)
    } finally {
      setDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <Card className="glass-card border-none rounded-xl" data-testid="enrollment-edit-card">
        <CardContent className="p-4">
          <EnrollmentForm
            defaultValues={enrollment}
            onSubmit={handleUpdateSubmit}
            onCancel={() => setIsEditing(false)}
            submitting={saving}
            submitLabel="수정 저장"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-none rounded-xl" data-testid="enrollment-card" data-enrollment-id={enrollment.id}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{enrollment.lesson_type}</span>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', statusConfig.badge)}>
                {statusConfig.label}
              </Badge>
              {alertLevel === 'urgent' && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50"
                  data-testid="payment-alert-badge"
                >
                  정산 임박
                </Badge>
              )}
              {alertLevel === 'due' && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-red-200 text-red-700 bg-red-50"
                  data-testid="payment-alert-badge"
                >
                  정산 필요
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(enrollment.start_date), 'yyyy년 M월 d일', { locale: ko })} 시작
              {enrollment.sessions_per_week ? ` · 주 ${enrollment.sessions_per_week}회` : ''}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setIsEditing(true)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={handleDeleteClick}
              disabled={deleting}
              data-testid="enrollment-delete-button"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {completedSessions !== null && (
          <div className="flex flex-col gap-1.5" data-testid="enrollment-progress">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {enrollment.total_sessions !== null
                  ? `${completedSessions} / ${enrollment.total_sessions}회 진행`
                  : `${completedSessions}회 진행 (무제한)`}
              </span>
              {progressPercent !== null && <span className="tabular-nums">{progressPercent}%</span>}
            </div>
            {progressPercent !== null && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    alertLevel === 'due' ? 'bg-red-500' : alertLevel === 'urgent' ? 'bg-amber-500' : 'bg-primary'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {enrollment.payment_note && (
          <p className="border-t border-border/40 pt-2 text-xs text-muted-foreground">{enrollment.payment_note}</p>
        )}
      </CardContent>
    </Card>
  )
}
