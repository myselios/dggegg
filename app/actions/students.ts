'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { studentInsertSchema, studentUpdateSchema } from '@/lib/validations'
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
  await requireAuth()
  const validated = studentInsertSchema.parse(input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  return data
}

export async function updateStudent(id: string, input: StudentUpdate) {
  await requireAuth()
  const validated = studentUpdateSchema.parse(input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return data
}

export async function deleteStudent(id: string) {
  await requireAuth()
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/students')
}
