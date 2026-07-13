'use client'

import { LayoutGrid, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StudentViewMode } from './student-view-mode'

export function StudentViewToggle({
  value,
  onChange,
}: {
  readonly value: StudentViewMode
  readonly onChange: (mode: StudentViewMode) => void
}) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border p-0.5"
      data-testid="student-view-toggle"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-7 gap-1.5 px-2 text-xs', value === 'card' && 'bg-muted')}
        onClick={() => onChange('card')}
        data-testid="student-view-card-btn"
        aria-pressed={value === 'card'}
      >
        <LayoutGrid className="size-3.5" />
        카드
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-7 gap-1.5 px-2 text-xs', value === 'table' && 'bg-muted')}
        onClick={() => onChange('table')}
        data-testid="student-view-table-btn"
        aria-pressed={value === 'table'}
      >
        <Table2 className="size-3.5" />
        표
      </Button>
    </div>
  )
}
