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
  readonly onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative h-[120px] border-l cursor-pointer hover:bg-muted/50 transition-colors',
        isToday && 'bg-primary/5',
        isWeekBoundary && 'border-l-2 border-l-primary/30',
        isOver && !hasConflictPreview && 'bg-primary/20 ring-2 ring-primary/40 ring-inset',
        isOver && hasConflictPreview && 'bg-red-100 ring-2 ring-red-400 ring-inset dark:bg-red-950/50 dark:ring-red-500'
      )}
      onClick={onClick}
    >
      {/* 10-min gridlines */}
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <div className="h-5 border-t" />
        <div className="h-5 border-t border-border/20" />
        <div className="h-5 border-t border-border/20" />
        <div className="h-5 border-t border-dashed border-border/40" />
        <div className="h-5 border-t border-border/20" />
        <div className="h-5 border-t border-border/20" />
      </div>
      {/* Events */}
      <div className="relative z-10 p-0.5">
        {children}
      </div>
    </div>
  )
}
