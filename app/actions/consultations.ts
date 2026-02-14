'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { consultationLogInsertSchema } from '@/lib/validations'
import type { ConsultationLogInsert } from '@/lib/types/database'

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

export async function createConsultationLog(input: ConsultationLogInsert) {
  await requireAuth()
  const validated = consultationLogInsertSchema.parse(input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultation_logs')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  return data
}

export async function deleteConsultationLog(id: string) {
  await requireAuth()
  const supabase = await createClient()
  const { error } = await supabase
    .from('consultation_logs')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/students')
}
