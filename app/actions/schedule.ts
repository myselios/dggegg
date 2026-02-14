'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ScheduleEventInsert, ScheduleEventUpdate } from '@/lib/types/database'

export async function getScheduleEvents(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .gte('start_at', startDate)
    .lte('start_at', endDate)
    .order('start_at')

  if (error) throw new Error(error.message)
  return data
}

export async function createScheduleEvent(input: ScheduleEventInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .insert(input)
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}

export async function updateScheduleEvent(id: string, input: ScheduleEventUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .update(input)
    .eq('id', id)
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}

export async function deleteScheduleEvent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
}

export async function createRecurringEvents(
  baseEvent: Omit<ScheduleEventInsert, 'recurrence_group_id'>,
  repeatCount: number
) {
  const groupId = crypto.randomUUID()
  const events: ScheduleEventInsert[] = []

  for (let i = 0; i < repeatCount; i++) {
    const start = new Date(baseEvent.start_at)
    const end = new Date(baseEvent.end_at)
    start.setDate(start.getDate() + i * 7)
    end.setDate(end.getDate() + i * 7)

    events.push({
      ...baseEvent,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      recurrence_group_id: groupId,
      recurrence_rule: `WEEKLY:${repeatCount}`,
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .insert(events)
    .select()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}
