'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types/database'

function getSupabase() {
  return createClient()
}

async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await getSupabase()
    .from('students')
    .select('*')
    .order('name_ko')

  if (error) throw new Error(error.message)
  return data
}

async function fetchStudent(id: string): Promise<Student> {
  const { data, error } = await getSupabase()
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export function useStudents() {
  return useSWR<Student[]>('students', fetchStudents)
}

export function useStudent(id: string) {
  return useSWR<Student>(id ? `student-${id}` : null, () => fetchStudent(id))
}
