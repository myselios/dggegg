'use client'

import { useMemo } from 'react'
import { useStudents } from '@/lib/hooks/use-students'
import { StudentCard } from './student-card'
import { StudentCreateDialog } from './student-create-dialog'
import { Badge } from '@/components/ui/badge'
import type { Student } from '@/lib/types/database'

const columns = [
  { key: 'active', label: 'Active', color: 'border-green-400' },
  { key: 'paused', label: 'Paused', color: 'border-yellow-400' },
  { key: 'ended', label: 'Ended', color: 'border-gray-400' },
] as const

export function StudentBoard() {
  const { data: students, error, isLoading } = useStudents()

  const grouped = useMemo(() => {
    if (!students) return { active: [], paused: [], ended: [] }
    return {
      active: students.filter((s) => s.status === 'active'),
      paused: students.filter((s) => s.status === 'paused'),
      ended: students.filter((s) => s.status === 'ended'),
    }
  }, [students])

  if (isLoading) return <div className="text-muted-foreground">로딩 중...</div>
  if (error) return <div className="text-red-500">에러: {error.message}</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">학생 관리</h2>
        <StudentCreateDialog />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.key} className={`flex flex-col gap-3 rounded-lg border-t-4 ${col.color} bg-muted/30 p-4`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{col.label}</h3>
              <Badge variant="outline">{grouped[col.key].length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {grouped[col.key].map((student: Student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
