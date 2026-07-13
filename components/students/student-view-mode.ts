export type StudentViewMode = 'card' | 'table'

export const STUDENT_VIEW_MODE_STORAGE_KEY = 'rocket-tutor:student-view-mode'

export function isStudentViewMode(value: string | null): value is StudentViewMode {
  return value === 'card' || value === 'table'
}
