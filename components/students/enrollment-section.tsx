'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getEnrollmentProgress,
} from '@/app/actions/enrollments'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EnrollmentCard } from './enrollment-card'
import { EnrollmentForm, parseEnrollmentFormData, type EnrollmentFormFields } from './enrollment-form'
import type { Enrollment } from '@/lib/types/database'

export function EnrollmentSection({ studentId }: { readonly studentId: string }) {
  const [enrollments, setEnrollments] = useState<readonly Enrollment[]>([])
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(null)
  const [completedSessions, setCompletedSessions] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(async () => {
    const [enrollmentsResult, progressResult] = await Promise.all([
      getEnrollments(studentId),
      getEnrollmentProgress(studentId),
    ])

    if (enrollmentsResult.success) {
      setEnrollments(enrollmentsResult.data)
    } else {
      toast.error(enrollmentsResult.error)
    }

    if (progressResult.success && progressResult.data) {
      setActiveEnrollmentId(progressResult.data.enrollment.id)
      setCompletedSessions(progressResult.data.completedSessions)
    } else {
      setActiveEnrollmentId(null)
      setCompletedSessions(null)
    }
  }, [studentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreate(formData: FormData) {
    setCreating(true)
    try {
      const fields = parseEnrollmentFormData(formData)
      const result = await createEnrollment({ ...fields, student_id: studentId, status: 'active' })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('수강권이 추가되었습니다')
      setShowForm(false)
      await loadData()
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, fields: EnrollmentFormFields) {
    const result = await updateEnrollment(id, fields)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('수강권이 수정되었습니다')
    await loadData()
  }

  async function handleDelete(id: string) {
    const result = await deleteEnrollment(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('수강권이 삭제되었습니다')
    await loadData()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="enrollment-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">수강권 관리</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="enrollment-add-toggle">
          {showForm ? (
            '취소'
          ) : (
            <>
              <Plus className="mr-1 size-4" />
              수강권 추가
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="glass-card border-none rounded-xl">
          <CardContent className="p-4">
            <EnrollmentForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitting={creating}
              submitLabel="추가"
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {enrollments.map((enrollment) => (
          <EnrollmentCard
            key={enrollment.id}
            enrollment={enrollment}
            completedSessions={enrollment.id === activeEnrollmentId ? completedSessions : null}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
        {enrollments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Wallet className="size-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">등록된 수강권이 없습니다</p>
            <p className="mt-1 text-xs text-muted-foreground/60">수강권을 추가해 회차와 정산을 관리하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
