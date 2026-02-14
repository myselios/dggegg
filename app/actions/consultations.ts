'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { consultationLogInsertSchema } from '@/lib/validations'
import type { ConsultationLog, ConsultationLogInsert } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError } from 'zod'

export async function getConsultationLogs(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultation_logs')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createConsultationLog(input: ConsultationLogInsert): Promise<ActionResult<ConsultationLog>> {
  try {
    await requireAuth()
    const validated = consultationLogInsertSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('consultation_logs')
      .insert(validated)
      .select()
      .single()

    if (error) {
      return { success: false, error: '상담 기록 저장에 실패했습니다' }
    }

    revalidatePath('/students')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '상담 기록 저장 중 오류가 발생했습니다' }
  }
}

export async function deleteConsultationLog(id: string): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { error } = await supabase
      .from('consultation_logs')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: '상담 기록 삭제에 실패했습니다' }
    }

    revalidatePath('/students')
    return { success: true, data: null }
  } catch {
    return { success: false, error: '상담 기록 삭제 중 오류가 발생했습니다' }
  }
}
