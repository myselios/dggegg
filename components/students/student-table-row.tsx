'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { IB_COURSE_STYLES, STUDENT_STATUS } from '@/lib/constants/status-styles'
import type { Student } from '@/lib/types/database'

export function StudentTableRow({
  student,
  selected,
  onToggleSelect,
  onRowClick,
}: {
  readonly student: Student
  readonly selected: boolean
  readonly onToggleSelect: () => void
  readonly onRowClick: () => void
}) {
  const course = student.ib_course ? IB_COURSE_STYLES[student.ib_course] : null
  const status = STUDENT_STATUS[student.status]

  return (
    <tr
      className={cn(
        'cursor-pointer border-b last:border-0 transition-colors hover:bg-accent/40',
        selected && 'bg-primary/8',
      )}
      onClick={onRowClick}
      data-testid="student-table-row"
    >
      <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="size-4 rounded border-input accent-primary"
          aria-label={`${student.name_ko} 선택`}
          data-testid="student-row-checkbox"
        />
      </td>
      <td className="px-3 py-3.5 font-semibold">{student.name_ko}</td>
      <td className="px-3 py-3.5 text-muted-foreground">{student.school}</td>
      <td className="px-3 py-3.5 text-muted-foreground">{student.grade ?? '-'}</td>
      <td className="px-3 py-3.5">
        {course ? (
          <Badge
            variant="outline"
            className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', course.className)}
          >
            {course.label}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-3 py-3.5 text-right font-medium tabular-nums">
        {student.current_score != null ? student.current_score : <span className="text-muted-foreground">-</span>}
      </td>
      <td className="px-3 py-3.5">
        <Badge
          variant="outline"
          className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', status.badge)}
        >
          {status.label}
        </Badge>
      </td>
    </tr>
  )
}
