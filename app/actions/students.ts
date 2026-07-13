'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { studentInsertSchema, studentUpdateSchema } from '@/lib/validations'
import type { Student, StudentInsert, StudentUpdate } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError, z } from 'zod'

const studentStatusSchema = z.enum(['active', 'paused', 'ended'])

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

export async function createStudentsBatch(
  inputs: readonly StudentInsert[]
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    await requireAuth()

    if (inputs.length === 0) {
      return { success: false, error: '추가할 학생이 없습니다' }
    }

    const validated = inputs.map((input) => studentInsertSchema.parse(input))

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .insert(validated)
      .select()

    if (error) {
      return { success: false, error: `학생 일괄 등록에 실패했습니다: ${error.message}` }
    }

    revalidatePath('/students')
    return {
      success: true,
      data: { created: data.length, skipped: inputs.length - data.length },
    }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map((issue) => issue.message).join(', ') }
    }
    return { success: false, error: '학생 일괄 등록 중 오류가 발생했습니다' }
  }
}

export async function bulkUpdateStudentStatus(
  ids: readonly string[],
  status: 'active' | 'paused' | 'ended'
): Promise<ActionResult<number>> {
  try {
    await requireAuth()

    if (ids.length === 0) {
      return { success: false, error: '변경할 학생을 선택해주세요' }
    }

    const validatedStatus = studentStatusSchema.parse(status)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .update({ status: validatedStatus })
      .in('id', ids)
      .select('id')

    if (error) {
      return { success: false, error: '학생 상태 일괄 변경에 실패했습니다' }
    }

    revalidatePath('/students')
    return { success: true, data: data.length }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map((issue) => issue.message).join(', ') }
    }
    return { success: false, error: '학생 상태 일괄 변경 중 오류가 발생했습니다' }
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
