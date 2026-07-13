import type { ScheduleEventWithStudent } from '@/lib/types/database'

export const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 07:00 ~ 23:00
export const MINUTES_10 = [0, 10, 20, 30, 40, 50] as const
export const CELL_HEIGHT_COMPACT = 48 // h-12
export const CELL_HEIGHT_EXPANDED = 120 // h-[120px]

export type ViewMode = '3week' | '1week' | 'day'

/** Encode a cell position into a droppable id */
export function cellId(dayIdx: number, hour: number): string {
  return `cell-${dayIdx}-${hour}`
}

/** Decode a droppable id back to day index, hour and minute */
export function parseCellId(
  id: string,
): { dayIdx: number; hour: number; minute: number } | null {
  const match = id.match(/^cell-(\d+)-(\d+)-(\d+)$/)
  if (!match) return null
  return { dayIdx: Number(match[1]), hour: Number(match[2]), minute: Number(match[3]) }
}

/** Check if two time ranges overlap: A.start < B.end && B.start < A.end */
export function hasTimeOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd)
}

/** Build a set of event IDs that have conflicts with at least one other event */
export function findConflictingIds(
  events: readonly ScheduleEventWithStudent[],
): ReadonlySet<string> {
  const ids = new Set<string>()
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]
      if (
        a.status !== 'cancelled' &&
        b.status !== 'cancelled' &&
        hasTimeOverlap(a.start_at, a.end_at, b.start_at, b.end_at)
      ) {
        ids.add(a.id)
        ids.add(b.id)
      }
    }
  }
  return ids
}

export function parseInitialDate(dateStr?: string): Date {
  if (!dateStr) return new Date()
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

/** Grid columns CSS for each view mode */
export function getGridCols(mode: ViewMode): string {
  switch (mode) {
    case '3week':
      return 'grid-cols-[52px_repeat(21,1fr)]'
    case '1week':
      return 'grid-cols-[48px_repeat(7,1fr)]'
    case 'day':
      return 'grid-cols-[48px_1fr]'
  }
}
