'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export function DroppableCell({
  id,
  isToday,
  isWeekBoundary,
  conflictHalfId,
  compact = true,
  children,
  onClick,
}: {
  readonly id: string
  readonly isToday: boolean
  readonly isWeekBoundary: boolean
  readonly conflictHalfId?: string | null
  readonly compact?: boolean
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
        'relative border-l border-border/70 cursor-pointer hover:bg-accent/40 transition-colors',
        compact ? 'h-12' : 'h-[120px]',
        isToday && 'bg-primary/[0.06]',
        isWeekBoundary && 'border-l-2 border-l-primary/30',
      )}
      data-testid="droppable-cell"
      onClick={onClick}
    >
      {/* Droppable halves for 30-min DnD precision */}
      <div
        ref={setTopRef}
        className={cn(
          'absolute inset-x-0 top-0 pointer-events-none transition-colors',
          compact ? 'h-[24px]' : 'h-[60px]',
          isOverTop && !topConflict && 'bg-primary/15 ring-2 ring-primary/50 ring-inset',
          isOverTop && topConflict && 'bg-red-100 ring-2 ring-red-400 ring-inset'
        )}
      />
      <div
        ref={setBotRef}
        className={cn(
          'absolute inset-x-0 pointer-events-none transition-colors',
          compact ? 'top-[24px] h-[24px]' : 'top-[60px] h-[60px]',
          isOverBot && !botConflict && 'bg-primary/15 ring-2 ring-primary/50 ring-inset',
          isOverBot && botConflict && 'bg-red-100 ring-2 ring-red-400 ring-inset'
        )}
      />

      {/* Gridlines: compact mode shows only :00 and :30, expanded shows all 10-min lines */}
      {compact ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col">
          <div className="h-6 border-t" />
          <div className="h-6 border-t border-dashed border-border/40" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex flex-col">
          <div className="h-5 border-t" />
          <div className="h-5 border-t border-border/20" />
          <div className="h-5 border-t border-border/20" />
          <div className="h-5 border-t border-dashed border-border/40" />
          <div className="h-5 border-t border-border/20" />
          <div className="h-5 border-t border-border/20" />
        </div>
      )}
      {/* Events — absolute positioned based on duration */}
      <div className="absolute inset-0 z-10">
        {children}
      </div>
    </div>
  )
}
