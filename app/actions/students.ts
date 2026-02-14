'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StudentInsert, StudentUpdate } from '@/lib/types/database'

export async function getStudents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name_ko')

  if (error) throw new Error(error.message)
  return data
}

export async function getStudent(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createStudent(input: StudentInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  return data
}

export async function updateStudent(id: string, input: StudentUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return data
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/students')
}
