'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export function DroppableCell({
  id,
  isToday,
  isWeekBoundary,
  conflictHalfId,
  children,
  onClick,
}: {
  readonly id: string
  readonly isToday: boolean
  readonly isWeekBoundary: boolean
  readonly conflictHalfId?: string | null
  readonly children: React.ReactNode
  readonly onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}) {
  const topId = `${id}-0`
  const bottomId = `${id}-30`

  const { setNodeRef: setTopRef, isOver: isOverTop } = useDroppable({ id: topId })
  const { setNodeRef: setBotRef, isOver: isOverBot } = useDroppable({ id: bottomId })

  const topConflict = conflictHalfId === topId
  const botConflict = conflictHalfId === bottomId

  return (
    <div
      className={cn(
        'relative h-[120px] border-l cursor-pointer hover:bg-muted/50 transition-colors',
        isToday && 'bg-primary/5',
        isWeekBoundary && 'border-l-2 border-l-primary/30',
      )}
      onClick={onClick}
    >
      {/* Droppable halves for 30-min DnD precision */}
      <div
        ref={setTopRef}
        className={cn(
          'absolute inset-x-0 top-0 h-[60px] pointer-events-none transition-colors',
          isOverTop && !topConflict && 'bg-primary/20 ring-2 ring-primary/40 ring-inset',
          isOverTop && topConflict && 'bg-red-100 ring-2 ring-red-400 ring-inset dark:bg-red-950/50 dark:ring-red-500'
        )}
      />
      <div
        ref={setBotRef}
        className={cn(
          'absolute inset-x-0 top-[60px] h-[60px] pointer-events-none transition-colors',
          isOverBot && !botConflict && 'bg-primary/20 ring-2 ring-primary/40 ring-inset',
          isOverBot && botConflict && 'bg-red-100 ring-2 ring-red-400 ring-inset dark:bg-red-950/50 dark:ring-red-500'
        )}
      />

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
