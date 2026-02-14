'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { scheduleEventInsertSchema, scheduleEventUpdateSchema, recurringEventSchema } from '@/lib/validations'
import type { ScheduleEventInsert, ScheduleEventUpdate, ScheduleEventWithStudent } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError } from 'zod'

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

export async function createScheduleEvent(input: ScheduleEventInsert): Promise<ActionResult<ScheduleEventWithStudent>> {
  try {
    await requireAuth()
    const validated = scheduleEventInsertSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedule_events')
      .insert(validated)
      .select('*, students(id, name_ko, name_en, school, ib_course)')
      .single()

    if (error) {
      return { success: false, error: '수업 일정 등록에 실패했습니다' }
    }

    revalidatePath('/schedule')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '수업 일정 등록 중 오류가 발생했습니다' }
  }
}

export async function updateScheduleEvent(id: string, input: ScheduleEventUpdate): Promise<ActionResult<ScheduleEventWithStudent>> {
  try {
    await requireAuth()
    const validated = scheduleEventUpdateSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedule_events')
      .update(validated)
      .eq('id', id)
      .select('*, students(id, name_ko, name_en, school, ib_course)')
      .single()

    if (error) {
      return { success: false, error: '수업 일정 수정에 실패했습니다' }
    }

    revalidatePath('/schedule')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '수업 일정 수정 중 오류가 발생했습니다' }
  }
}

export async function deleteScheduleEvent(id: string): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { error } = await supabase
      .from('schedule_events')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: '수업 일정 삭제에 실패했습니다' }
    }

    revalidatePath('/schedule')
    return { success: true, data: null }
  } catch {
    return { success: false, error: '수업 일정 삭제 중 오류가 발생했습니다' }
  }
}

export async function createRecurringEvents(
  baseEvent: Omit<ScheduleEventInsert, 'recurrence_group_id'>,
  repeatCount: number
): Promise<ActionResult<ReadonlyArray<ScheduleEventInsert>>> {
  try {
    await requireAuth()
    const { baseEvent: validatedBase, repeatCount: validatedCount } = recurringEventSchema.parse({ baseEvent, repeatCount })
    const groupId = crypto.randomUUID()
    const events: ScheduleEventInsert[] = []

    for (let i = 0; i < validatedCount; i++) {
      const start = new Date(validatedBase.start_at)
      const end = new Date(validatedBase.end_at)
      start.setDate(start.getDate() + i * 7)
      end.setDate(end.getDate() + i * 7)

      events.push({
        student_id: validatedBase.student_id,
        status: validatedBase.status,
        template_type: validatedBase.template_type,
        color: validatedBase.color,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        recurrence_group_id: groupId,
        recurrence_rule: `WEEKLY:${validatedCount}`,
      })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedule_events')
      .insert(events)
      .select()

    if (error) {
      return { success: false, error: '반복 수업 등록에 실패했습니다' }
    }

    revalidatePath('/schedule')
    return { success: true, data }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map(issue => issue.message).join(', ') }
    }
    return { success: false, error: '반복 수업 등록 중 오류가 발생했습니다' }
  }
}
