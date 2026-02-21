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
    .select('*, students(id, name_ko, school, ib_course)')
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

    // 수업인 경우에만 같은 학생, 겹치는 시간대에 기존 이벤트가 있는지 확인
    if (validated.student_id) {
      const { data: existing } = await supabase
        .from('schedule_events')
        .select('id')
        .eq('student_id', validated.student_id)
        .neq('status', 'cancelled')
        .lt('start_at', validated.end_at)
        .gt('end_at', validated.start_at)
        .limit(1)

      if (existing && existing.length > 0) {
        return { success: false, error: '해당 시간에 이미 수업이 등록되어 있습니다' }
      }
    }

    const { event_type: _eventType, ...insertData } = validated
    const { data, error} = await supabase
      .from('schedule_events')
      .insert(insertData)
      .select('*, students(id, name_ko, school, ib_course)')
      .single()

    if (error) {
      console.error('[createScheduleEvent] Supabase error:', error.message, error.code, error.details)
      return { success: false, error: `일정 등록에 실패했습니다: ${error.message}` }
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
    scheduleEventUpdateSchema.parse(input) // validation only
    // Only send fields that were actually provided (avoid Zod filling in defaults)
    const updateData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    )
    const supabase = await createClient()

    // 시간이 변경되는 경우 중복 체크 (학생이 있는 수업인 경우에만)
    if (updateData.start_at && updateData.end_at) {
      const { data: current } = await supabase
        .from('schedule_events')
        .select('student_id')
        .eq('id', id)
        .single()

      if (current && current.student_id) {
        const { data: existing } = await supabase
          .from('schedule_events')
          .select('id')
          .eq('student_id', current.student_id)
          .neq('id', id)
          .neq('status', 'cancelled')
          .lt('start_at', updateData.end_at as string)
          .gt('end_at', updateData.start_at as string)
          .limit(1)

        if (existing && existing.length > 0) {
          return { success: false, error: '해당 시간에 이미 수업이 등록되어 있습니다' }
        }
      }
    }

    const { data, error } = await supabase
      .from('schedule_events')
      .update(updateData)
      .eq('id', id)
      .select('*, students(id, name_ko, school, ib_course)')
      .single()

    if (error) {
      console.error('[updateScheduleEvent] Supabase error:', error.message, error.code, error.details)
      return { success: false, error: `수업 일정 수정에 실패했습니다: ${error.message}` }
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

export async function autoCompletePastEvents(): Promise<ActionResult<number>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedule_events')
      .update({ status: 'completed' })
      .eq('status', 'scheduled')
      .lt('end_at', new Date().toISOString())
      .select('id')

    if (error) {
      return { success: false, error: '자동 완료 처리에 실패했습니다' }
    }

    if (data.length > 0) {
      revalidatePath('/schedule')
      revalidatePath('/')
    }

    return { success: true, data: data.length }
  } catch {
    return { success: false, error: '자동 완료 처리 중 오류가 발생했습니다' }
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
        title: validatedBase.title,
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

    // 각 반복 이벤트에 대해 시간 겹침 확인
    for (const event of events) {
      const { data: existing } = await supabase
        .from('schedule_events')
        .select('id')
        .eq('student_id', event.student_id)
        .neq('status', 'cancelled')
        .lt('start_at', event.end_at)
        .gt('end_at', event.start_at)
        .limit(1)

      if (existing && existing.length > 0) {
        const conflictDate = new Date(event.start_at).toLocaleDateString('ko-KR')
        return { success: false, error: `${conflictDate}에 이미 수업이 등록되어 있습니다` }
      }
    }

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
