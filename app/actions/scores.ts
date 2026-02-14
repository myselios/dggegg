'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { scoreRecordInsertSchema } from '@/lib/validations'
import type { ScoreRecordInsert } from '@/lib/types/database'

export async function createScoreRecord(input: ScoreRecordInsert) {
  await requireAuth()
  const validated = scoreRecordInsertSchema.parse(input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('score_records')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
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
