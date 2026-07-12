'use client'

import useSWR from 'swr'
import { getStudent, getStudents } from '@/app/actions/students'
import type { Student } from '@/lib/types/database'

async function fetchStudents(): Promise<Student[]> {
  const res = await getStudents()
  if (!res.success) throw new Error(res.error)
  return res.data
}

export function useStudents() {
  return useSWR<Student[]>('students', fetchStudents)
}

export function useStudent(id: string) {
  return useSWR<Student>(
    id ? `student-${id}` : null,
    () => getStudent(id) as Promise<Student>,
  )
}
