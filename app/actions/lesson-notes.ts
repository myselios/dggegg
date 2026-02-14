'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { lessonNoteInsertSchema } from '@/lib/validations'
import type { LessonNote, LessonNoteInsert } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError } from 'zod'

export async function getLessonNote(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('event_id', eventId)
    .single()
  return data
}

export async function upsertLessonNote(input: LessonNoteInsert): Promise<ActionResult<LessonNote>> {
  try {
    await requireAuth()
    const validated = lessonNoteInsertSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('lesson_notes')
      .upsert(validated, { onConflict: 'event_id' })
      .select()
      .single()

    if (error) {
      return { success: false, error: '수업 노트 저장에 실패했습니다' }
    }

    revalidatePath('/schedule')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '수업 노트 저장 중 오류가 발생했습니다' }
  }
}

export async function getPreviousLessonNote(studentId: string, beforeDate: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_notes')
    .select('*, schedule_events(start_at, template_type)')
    .eq('student_id', studentId)
    .lt('created_at', beforeDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function getStudentLessonNotes(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*, schedule_events(start_at, template_type)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
