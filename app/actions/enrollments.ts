'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { enrollmentInsertSchema, enrollmentUpdateSchema } from '@/lib/validations'
import type { Enrollment, EnrollmentInsert, EnrollmentUpdate, Student } from '@/lib/types/database'
import type { ActionResult } from '@/lib/types/action-result'
import { ZodError } from 'zod'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const ENROLLMENT_FIELDS =
  'id, student_id, start_date, end_date, sessions_per_week, lesson_type, notes, status, total_sessions, payment_note, created_at'

export async function getEnrollments(studentId: string): Promise<ActionResult<readonly Enrollment[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('enrollments')
      .select(ENROLLMENT_FIELDS)
      .eq('student_id', studentId)
      .order('start_date', { ascending: false })

    if (error) {
      return { success: false, error: '수강 정보 조회에 실패했습니다' }
    }
    return { success: true, data: data as Enrollment[] }
  } catch {
    return { success: false, error: '수강 정보 조회 중 오류가 발생했습니다' }
  }
}

export async function createEnrollment(input: EnrollmentInsert): Promise<ActionResult<Enrollment>> {
  try {
    await requireAuth()
    const validated = enrollmentInsertSchema.parse(input)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('enrollments')
      .insert(validated)
      .select(ENROLLMENT_FIELDS)
      .single()

    if (error) {
      return { success: false, error: '수강 등록에 실패했습니다' }
    }

    revalidatePath('/students')
    revalidatePath(`/students/${validated.student_id}`)
    return { success: true, data: data as Enrollment }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map((issue) => issue.message).join(', ') }
    }
    return { success: false, error: '수강 등록 중 오류가 발생했습니다' }
  }
}

export async function updateEnrollment(id: string, input: EnrollmentUpdate): Promise<ActionResult<Enrollment>> {
  try {
    await requireAuth()
    enrollmentUpdateSchema.parse(input) // validation only
    const updateData = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    )
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', id)
      .select(ENROLLMENT_FIELDS)
      .single()

    if (error) {
      return { success: false, error: '수강 정보 수정에 실패했습니다' }
    }

    revalidatePath('/students')
    revalidatePath(`/students/${data.student_id}`)
    return { success: true, data: data as Enrollment }
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues.map((issue) => issue.message).join(', ') }
    }
    return { success: false, error: '수강 정보 수정 중 오류가 발생했습니다' }
  }
}

export async function deleteEnrollment(id: string): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: '수강 정보 삭제에 실패했습니다' }
    }

    revalidatePath('/students')
    return { success: true, data: null }
  } catch {
    return { success: false, error: '수강 정보 삭제 중 오류가 발생했습니다' }
  }
}

async function countCompletedSessions(
  supabase: SupabaseClient,
  studentId: string,
  sinceDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('schedule_events')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .gte('start_at', sinceDate)

  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export type EnrollmentProgress = {
  readonly enrollment: Enrollment
  readonly completedSessions: number
}

export async function getEnrollmentProgress(
  studentId: string
): Promise<ActionResult<EnrollmentProgress | null>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(ENROLLMENT_FIELDS)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { success: false, error: '수강 현황 조회에 실패했습니다' }
    }
    if (!enrollment) {
      return { success: true, data: null }
    }

    const completedSessions = await countCompletedSessions(
      supabase,
      studentId,
      enrollment.start_date
    )
    return {
      success: true,
      data: { enrollment: enrollment as Enrollment, completedSessions },
    }
  } catch {
    return { success: false, error: '수강 현황 조회 중 오류가 발생했습니다' }
  }
}

export type PaymentAlert = {
  readonly enrollment: Enrollment
  readonly student: Pick<Student, 'id' | 'name_ko'>
  readonly completedSessions: number
}

type EnrollmentWithStudent = Enrollment & {
  readonly students: Pick<Student, 'id' | 'name_ko'> | null
}

async function buildPaymentAlerts(
  supabase: SupabaseClient,
  enrollments: readonly EnrollmentWithStudent[]
): Promise<readonly PaymentAlert[]> {
  const withCounts = await Promise.all(
    enrollments.map(async (enrollment) => ({
      enrollment,
      completedSessions: await countCompletedSessions(
        supabase,
        enrollment.student_id,
        enrollment.start_date
      ),
    }))
  )

  return withCounts
    .filter(
      ({ enrollment, completedSessions }) =>
        enrollment.total_sessions !== null &&
        enrollment.students !== null &&
        completedSessions >= enrollment.total_sessions - 1
    )
    .map(({ enrollment, completedSessions }) => ({
      enrollment,
      student: enrollment.students as Pick<Student, 'id' | 'name_ko'>,
      completedSessions,
    }))
}

export async function getPaymentAlerts(): Promise<ActionResult<readonly PaymentAlert[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('enrollments')
      .select(`${ENROLLMENT_FIELDS}, students(id, name_ko)`)
      .eq('status', 'active')
      .not('total_sessions', 'is', null)

    if (error) {
      return { success: false, error: '정산 알림 조회에 실패했습니다' }
    }

    const alerts = await buildPaymentAlerts(supabase, (data ?? []) as unknown as EnrollmentWithStudent[])
    return { success: true, data: alerts }
  } catch {
    return { success: false, error: '정산 알림 조회 중 오류가 발생했습니다' }
  }
}
