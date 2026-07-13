import { STUDENT_STATUS } from '@/lib/constants/status-styles'
import type { Student } from '@/lib/types/database'

const CSV_HEADERS = ['이름', '학교', '학년', '과정', '현재점수', '상태'] as const

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function studentToCsvRow(student: Student): string {
  const statusLabel = STUDENT_STATUS[student.status]?.label ?? student.status
  const fields = [
    student.name_ko,
    student.school,
    student.grade ?? '',
    student.ib_course ?? '',
    student.current_score != null ? String(student.current_score) : '',
    statusLabel,
  ]
  return fields.map(escapeCsvField).join(',')
}

export function buildStudentsCsv(students: readonly Student[]): string {
  const rows = students.map(studentToCsvRow)
  return [CSV_HEADERS.join(','), ...rows].join('\r\n')
}

export function downloadStudentsCsv(students: readonly Student[], filename = 'students.csv'): void {
  const bom = '﻿'
  const blob = new Blob([bom + buildStudentsCsv(students)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
