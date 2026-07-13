'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STUDENT_STATUS } from '@/lib/constants/status-styles'
import type { Student } from '@/lib/types/database'

const BULK_STATUS_OPTIONS: readonly { readonly value: Student['status']; readonly label: string }[] = [
  { value: 'active', label: STUDENT_STATUS.active.label },
  { value: 'paused', label: STUDENT_STATUS.paused.label },
  { value: 'ended', label: STUDENT_STATUS.ended.label },
]

export function StudentSelectionBar({
  count,
  disabled,
  onStatusChange,
  onClear,
}: {
  readonly count: number
  readonly disabled: boolean
  readonly onStatusChange: (status: Student['status']) => void
  readonly onClear: () => void
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-primary/20 border-l-4 border-l-primary bg-primary/5 px-4 py-2.5"
      data-testid="student-selection-bar"
    >
      <Badge
        className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground"
        data-testid="student-selection-count"
      >
        {count}명 선택
      </Badge>

      <span className="text-xs font-medium text-muted-foreground">상태 변경:</span>
      {BULK_STATUS_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-primary/25 bg-card px-3 text-xs font-medium hover:bg-primary/10"
          disabled={disabled}
          onClick={() => onStatusChange(opt.value)}
          data-testid={`bulk-status-${opt.value}`}
        >
          {opt.label}
        </Button>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClear}
        data-testid="student-selection-clear"
      >
        <X className="size-3" />
        선택 해제
      </Button>
    </div>
  )
}
