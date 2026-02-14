'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { studentInsertSchema, studentUpdateSchema } from '@/lib/validations'
import type { Student, StudentInsert, StudentUpdate } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError } from 'zod'

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

export async function createStudent(input: StudentInsert): Promise<ActionResult<Student>> {
  try {
    await requireAuth()
    const validated = studentInsertSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .insert(validated)
      .select()
      .single()

    if (error) {
      return { success: false, error: '학생 등록에 실패했습니다' }
    }

    revalidatePath('/students')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '학생 등록 중 오류가 발생했습니다' }
  }
}

export async function updateStudent(id: string, input: StudentUpdate): Promise<ActionResult<Student>> {
  try {
    await requireAuth()
    const validated = studentUpdateSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: '학생 정보 수정에 실패했습니다' }
    }

    revalidatePath('/students')
    revalidatePath(`/students/${id}`)
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '학생 정보 수정 중 오류가 발생했습니다' }
  }
}

export async function deleteStudent(id: string): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: '학생 삭제에 실패했습니다' }
    }

    revalidatePath('/students')
    return { success: true, data: null }
  } catch {
    return { success: false, error: '학생 삭제 중 오류가 발생했습니다' }
  }
}
