'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CheckCircle2, PauseCircle, XCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useStudents } from '@/lib/hooks/use-students'
import { updateStudent } from '@/app/actions/students'
import { StudentCard, StudentCardOverlay } from './student-card'
import { StudentCreateDialog } from './student-create-dialog'
import { StudentCsvImportDialog } from './student-csv-import-dialog'
import { StudentToolbar, EMPTY_FILTERS, type StudentFilters } from './student-toolbar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STUDENT_STATUS } from '@/lib/constants/status-styles'
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
    label: STUDENT_STATUS.active.label,
    icon: CheckCircle2,
    borderColor: STUDENT_STATUS.active.border,
    iconColor: STUDENT_STATUS.active.icon,
    badgeClassName: STUDENT_STATUS.active.badge,
    emptyMessage: '활성 학생이 없습니다',
  },
  {
    key: 'paused',
    label: STUDENT_STATUS.paused.label,
    icon: PauseCircle,
    borderColor: STUDENT_STATUS.paused.border,
    iconColor: STUDENT_STATUS.paused.icon,
    badgeClassName: STUDENT_STATUS.paused.badge,
    emptyMessage: '일시 중지된 학생이 없습니다',
  },
  {
    key: 'ended',
    label: STUDENT_STATUS.ended.label,
    icon: XCircle,
    borderColor: STUDENT_STATUS.ended.border,
    iconColor: STUDENT_STATUS.ended.icon,
    badgeClassName: STUDENT_STATUS.ended.badge,
    emptyMessage: '종료된 학생이 없습니다',
  },
] as const

function ColumnPlaceholder({ message }: { readonly message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 py-10 text-center">
      <UserPlus className="mb-2 size-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground/50">{message}</p>
    </div>
  )
}

function DroppableColumn({
  config,
  students,
}: {
  readonly config: ColumnConfig
  readonly students: readonly Student[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: config.key })
  const Icon = config.icon

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-3 rounded-2xl glass-card border-none border-t-3 p-4 transition-colors',
        config.borderColor,
        isOver && 'bg-primary/10 ring-2 ring-primary/30 ring-inset',
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <Icon className={cn('size-4', config.iconColor)} />
        <h3 className="text-sm font-semibold">{config.label}</h3>
        <Badge
          variant="outline"
          className={cn('ml-auto border text-[11px] font-semibold', config.badgeClassName)}
        >
          {students.length}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {students.length === 0 ? (
          <ColumnPlaceholder message={config.emptyMessage} />
        ) : (
          students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))
        )}
      </div>
    </div>
  )
}

function filterStudents(
  students: readonly Student[],
  searchQuery: string,
  filters: StudentFilters,
): Student[] {
  const query = searchQuery.toLowerCase().trim()

  return students.filter((s) => {
    // Search: match name_ko
    if (query) {
      if (!s.name_ko.toLowerCase().includes(query)) return false
    }

    // Filter: school
    if (filters.school && s.school !== filters.school) return false

    // Filter: course
    if (filters.course && s.ib_course !== filters.course) return false

    // Filter: status
    if (filters.status && s.status !== filters.status) return false

    return true
  })
}

export function StudentBoard() {
  const { data: students, error, isLoading, mutate } = useStudents()
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  // Extract unique schools for filter options
  const schools = useMemo(() => {
    if (!students) return []
    const unique = [...new Set(students.map((s) => s.school))].sort()
    return unique
  }, [students])

  // Apply search + filters, then group by status
  const filtered = useMemo(() => {
    if (!students) return []
    return filterStudents(students, searchQuery, filters)
  }, [students, searchQuery, filters])

  const grouped = useMemo(() => ({
    active: filtered.filter((s) => s.status === 'active'),
    paused: filtered.filter((s) => s.status === 'paused'),
    ended: filtered.filter((s) => s.status === 'ended'),
  }), [filtered])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragged = event.active.data.current?.student as Student | undefined
    if (dragged) setActiveStudent(dragged)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveStudent(null)

    const { active, over } = event
    if (!over) return

    const draggedStudent = active.data.current?.student as Student | undefined
    if (!draggedStudent) return

    const targetStatus = String(over.id) as ColumnKey
    if (!['active', 'paused', 'ended'].includes(targetStatus)) return

    // Same column — no op
    if (draggedStudent.status === targetStatus) return

    const optimisticStudents = students?.map((s) =>
      s.id === draggedStudent.id ? { ...s, status: targetStatus } : s
    ) as Student[] | undefined

    try {
      await mutate(
        async () => {
          const result = await updateStudent(draggedStudent.id, { status: targetStatus })
          if (!result.success) {
            throw new Error(result.error)
          }
          return optimisticStudents ?? []
        },
        { optimisticData: optimisticStudents, rollbackOnError: true }
      )
      const statusLabels: Record<ColumnKey, string> = {
        active: '수업 중',
        paused: '일시 중지',
        ended: '종료',
      }
      toast.success(`${draggedStudent.name_ko} → ${statusLabels[targetStatus]}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다'
      toast.error(message)
    }
  }, [students, mutate])

  const handleDragCancel = useCallback(() => {
    setActiveStudent(null)
  }, [])

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
  const isFiltered = searchQuery || filters.school || filters.course || filters.status

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">학생 관리</h2>
          <Badge variant="secondary" className="text-xs">
            {isFiltered ? `${filtered.length}/${totalCount}명` : `${totalCount}명`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <StudentCreateDialog />
          <StudentCsvImportDialog />
        </div>
      </div>

      <StudentToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        schools={schools}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {columns.map((col) => (
            <DroppableColumn
              key={col.key}
              config={col}
              students={grouped[col.key]}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeStudent ? <StudentCardOverlay student={activeStudent} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
