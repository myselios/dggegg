'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export function DroppableCell({
  id,
  isToday,
  isWeekBoundary,
  hasConflictPreview = false,
  children,
  onClick,
}: {
  readonly id: string
  readonly isToday: boolean
  readonly isWeekBoundary: boolean
  readonly hasConflictPreview?: boolean
  readonly children: React.ReactNode
  readonly onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[48px] border-l p-0.5 cursor-pointer hover:bg-muted/50 transition-colors',
        isToday && 'bg-primary/5',
        isWeekBoundary && 'border-l-2 border-l-primary/30',
        isOver && !hasConflictPreview && 'bg-primary/20 ring-2 ring-primary/40 ring-inset',
        isOver && hasConflictPreview && 'bg-red-100 ring-2 ring-red-400 ring-inset dark:bg-red-950/50 dark:ring-red-500'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
