'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { scoreRecordInsertSchema } from '@/lib/validations'
import type { ScoreRecord, ScoreRecordInsert } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError } from 'zod'

export async function createScoreRecord(input: ScoreRecordInsert): Promise<ActionResult<ScoreRecord>> {
  try {
    await requireAuth()
    const validated = scoreRecordInsertSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('score_records')
      .insert(validated)
      .select()
      .single()

    if (error) {
      return { success: false, error: '성적 기록 저장에 실패했습니다' }
    }

    revalidatePath('/schedule')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '성적 기록 저장 중 오류가 발생했습니다' }
  }
}

export async function getStudentScores(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('score_records')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
