'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { bulkUpdateStudentStatus } from '@/app/actions/students'
import { cn } from '@/lib/utils'
import { StudentSelectionBar } from './student-selection-bar'
import { StudentTableRow } from './student-table-row'
import type { Student } from '@/lib/types/database'

type SortColumn = 'name_ko' | 'school' | 'grade' | 'ib_course' | 'current_score' | 'status'
type SortDirection = 'asc' | 'desc'

const COLUMNS: readonly { readonly key: SortColumn; readonly label: string }[] = [
  { key: 'name_ko', label: '이름' },
  { key: 'school', label: '학교' },
  { key: 'grade', label: '학년' },
  { key: 'ib_course', label: 'IB과정' },
  { key: 'current_score', label: '현재점수' },
  { key: 'status', label: '상태' },
]

function compareValues(a: Student, b: Student, column: SortColumn): number {
  if (column === 'current_score') {
    return (a.current_score ?? -Infinity) - (b.current_score ?? -Infinity)
  }
  return String(a[column] ?? '').localeCompare(String(b[column] ?? ''), 'ko')
}

function sortStudents(
  students: readonly Student[],
  column: SortColumn,
  direction: SortDirection,
): Student[] {
  const sorted = [...students].sort((a, b) => compareValues(a, b, column))
  return direction === 'asc' ? sorted : sorted.reverse()
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  readonly label: string
  readonly active: boolean
  readonly direction: SortDirection
  readonly onClick: () => void
}) {
  const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th className="px-3 py-2.5 text-left font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-1 transition-colors hover:text-foreground',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
        data-testid={`sort-header-${label}`}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </th>
  )
}

export function StudentTable({ students }: { readonly students: readonly Student[] }) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [sortColumn, setSortColumn] = useState<SortColumn>('name_ko')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const sorted = useMemo(
    () => sortStudents(students, sortColumn, sortDirection),
    [students, sortColumn, sortDirection],
  )

  const validSelectedIds = useMemo(
    () => selectedIds.filter((id) => sorted.some((s) => s.id === id)),
    [selectedIds, sorted],
  )
  const allSelected = sorted.length > 0 && validSelectedIds.length === sorted.length
  const someSelected = validSelectedIds.length > 0 && !allSelected

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortColumn(column)
    setSortDirection('asc')
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : sorted.map((s) => s.id))
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    )
  }

  async function handleBulkStatusChange(status: Student['status']) {
    if (validSelectedIds.length === 0 || isBulkUpdating) return
    setIsBulkUpdating(true)
    try {
      const result = await bulkUpdateStudentStatus(validSelectedIds, status)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.data}명의 상태를 변경했습니다`)
      await mutate('students')
      setSelectedIds([])
    } catch {
      toast.error('상태 일괄 변경 중 오류가 발생했습니다')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {validSelectedIds.length > 0 && (
        <StudentSelectionBar
          count={validSelectedIds.length}
          disabled={isBulkUpdating}
          onStatusChange={handleBulkStatusChange}
          onClear={() => setSelectedIds([])}
        />
      )}

      <div className="overflow-x-auto rounded-xl border" data-testid="student-table-container">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={toggleSelectAll}
                  className="size-4 rounded border-input accent-primary"
                  aria-label="전체 선택"
                  data-testid="select-all-checkbox"
                />
              </th>
              {COLUMNS.map((col) => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  active={sortColumn === col.key}
                  direction={sortDirection}
                  onClick={() => handleSort(col.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => (
              <StudentTableRow
                key={student.id}
                student={student}
                selected={validSelectedIds.includes(student.id)}
                onToggleSelect={() => toggleSelect(student.id)}
                onRowClick={() => router.push(`/students/${student.id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
