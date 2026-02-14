'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LessonNoteInsert } from '@/lib/types/database'

export async function getLessonNote(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('event_id', eventId)
    .single()
  return data
}

export async function upsertLessonNote(input: LessonNoteInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_notes')
    .upsert(input, { onConflict: 'event_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
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
