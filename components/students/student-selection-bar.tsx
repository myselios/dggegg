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
      className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2"
      data-testid="student-selection-bar"
    >
      <Badge variant="secondary" className="text-xs" data-testid="student-selection-count">
        {count}명 선택
      </Badge>

      <span className="text-xs text-muted-foreground">상태 변경:</span>
      {BULK_STATUS_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
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
        className="ml-auto h-7 gap-1 px-2 text-xs text-muted-foreground"
        onClick={onClear}
        data-testid="student-selection-clear"
      >
        <X className="size-3" />
        선택 해제
      </Button>
    </div>
  )
}
