'use client'

import useSWR from 'swr'
import { getStudent, getStudents } from '@/app/actions/students'
import type { Student } from '@/lib/types/database'

export function useStudents() {
  return useSWR<Student[]>('students', () => getStudents() as Promise<Student[]>)
}

export function useStudent(id: string) {
  return useSWR<Student>(
    id ? `student-${id}` : null,
    () => getStudent(id) as Promise<Student>,
  )
}
