'use client'

import { useMemo } from 'react'
import { CheckCircle2, PauseCircle, XCircle, UserPlus } from 'lucide-react'
import { useStudents } from '@/lib/hooks/use-students'
import { StudentCard } from './student-card'
import { StudentCreateDialog } from './student-create-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Student } from '@/lib/types/database'
import type { LucideIcon } from 'lucide-react'

type ColumnKey = 'active' | 'paused' | 'ended'

type ColumnConfig = {
  readonly key: ColumnKey
  readonly label: string
  readonly icon: LucideIcon
  readonly borderColor: string
  readonly iconColor: string
  readonly badgeClassName: string
  readonly emptyMessage: string
}

const columns: readonly ColumnConfig[] = [
  {
    key: 'active',
    label: '수업 중',
    icon: CheckCircle2,
    borderColor: 'border-t-emerald-500',
    iconColor: 'text-emerald-500',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    emptyMessage: '활성 학생이 없습니다',
  },
  {
    key: 'paused',
    label: '일시 중지',
    icon: PauseCircle,
    borderColor: 'border-t-amber-500',
    iconColor: 'text-amber-500',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    emptyMessage: '일시 중지된 학생이 없습니다',
  },
  {
    key: 'ended',
    label: '종료',
    icon: XCircle,
    borderColor: 'border-t-gray-400',
    iconColor: 'text-gray-400',
    badgeClassName: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    emptyMessage: '종료된 학생이 없습니다',
  },
] as const

function ColumnPlaceholder({ message }: { readonly message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-10 text-center">
      <UserPlus className="mb-2 size-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground/50">{message}</p>
    </div>
  )
}

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        로딩 중...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        에러: {error.message}
      </div>
    )
  }

  const totalCount = (students ?? []).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">학생 관리</h2>
          <Badge variant="secondary" className="text-xs">
            {totalCount}명
          </Badge>
        </div>
        <StudentCreateDialog />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((col) => {
          const Icon = col.icon
          const columnStudents = grouped[col.key]

          return (
            <div
              key={col.key}
              className={cn(
                'flex flex-col gap-3 rounded-xl border border-border/40 border-t-4 bg-muted/20 p-4',
                col.borderColor,
              )}
            >
              <div className="flex items-center gap-2 px-1 pb-1">
                <Icon className={cn('size-4', col.iconColor)} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge
                  variant="outline"
                  className={cn('ml-auto border text-[11px] font-semibold', col.badgeClassName)}
                >
                  {columnStudents.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {columnStudents.length === 0 ? (
                  <ColumnPlaceholder message={col.emptyMessage} />
                ) : (
                  columnStudents.map((student: Student) => (
                    <StudentCard key={student.id} student={student} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
