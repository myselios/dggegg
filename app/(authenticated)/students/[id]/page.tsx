'use client'

import { useParams } from 'next/navigation'
import { useStudent } from '@/lib/hooks/use-students'
import { StudentTabs } from '@/components/students/student-tabs'

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: student, isLoading } = useStudent(params.id)

  if (isLoading || !student) {
    return (
      <div className="flex flex-col gap-6">
        <div className="glass-card flex items-center gap-4 rounded-2xl p-5">
          <div className="size-12 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" />
        <div className="glass-card h-72 animate-pulse rounded-2xl" />
      </div>
    )
  }

  return <StudentTabs student={student} />
}
