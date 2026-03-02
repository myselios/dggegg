'use client'

import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useStudents } from '@/lib/hooks/use-students'
import { StudentCard } from './student-card'
import { StudentCreateDialog } from './student-create-dialog'
import { StudentCsvImportDialog } from './student-csv-import-dialog'
import { StudentToolbar, EMPTY_FILTERS, type StudentFilters } from './student-toolbar'
import { Badge } from '@/components/ui/badge'
import type { Student } from '@/lib/types/database'

function filterStudents(
  students: readonly Student[],
  searchQuery: string,
  filters: StudentFilters,
): Student[] {
  const query = searchQuery.toLowerCase().trim()

  return students.filter((s) => {
    if (query && !s.name_ko.toLowerCase().includes(query)) return false
    if (filters.school && s.school !== filters.school) return false
    if (filters.course && s.ib_course !== filters.course) return false
    return true
  })
}

export function StudentBoard() {
  const { data: students, error, isLoading } = useStudents()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS)

  const schools = useMemo(() => {
    if (!students) return []
    return [...new Set(students.map((s) => s.school))].sort()
  }, [students])

  const filtered = useMemo(() => {
    if (!students) return []
    return filterStudents(students, searchQuery, filters)
  }, [students, searchQuery, filters])

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
  const isFiltered = searchQuery || filters.school || filters.course

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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 py-20 text-center">
          <UserPlus className="mb-2 size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/50">학생이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}
