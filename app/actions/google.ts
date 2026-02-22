'use server'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl, disconnectGoogle, isGoogleConnected } from '@/lib/google/auth'
import { createCalendarEvent } from '@/lib/google/calendar'
import type { ActionResult } from '@/lib/types/action-result'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

export async function getGoogleAuthUrl(): Promise<ActionResult<string>> {
  try {
    await requireAuth()
    const url = getAuthUrl()
    if (!url) {
      return { success: false, error: 'Google OAuth가 설정되지 않았습니다. 환경변수를 확인하세요.' }
    }
    return { success: true, data: url }
  } catch {
    return { success: false, error: 'Google 인증 URL 생성에 실패했습니다' }
  }
}

export async function disconnectGoogleAccount(): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    await disconnectGoogle()
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Google 연동 해제에 실패했습니다' }
  }
}

export async function checkGoogleConnection(): Promise<ActionResult<boolean>> {
  try {
    await requireAuth()
    const connected = await isGoogleConnected()
    return { success: true, data: connected }
  } catch {
    return { success: false, error: '연동 상태 확인에 실패했습니다' }
  }
}

/** 기존 수업 중 Google Calendar에 동기화되지 않은 이벤트를 일괄 동기화 */
export async function syncExistingEvents(): Promise<ActionResult<number>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    // google_calendar_event_id가 null인 수업만 조회
    const { data: events, error } = await supabase
      .from('schedule_events')
      .select('*, students(id, name_ko, school, ib_course)')
      .is('google_calendar_event_id', null)
      .order('start_at')

    if (error) {
      return { success: false, error: `이벤트 조회 실패: ${error.message}` }
    }

    if (!events || events.length === 0) {
      return { success: true, data: 0 }
    }

    let synced = 0
    for (const event of events as ScheduleEventWithStudent[]) {
      const result = await createCalendarEvent(event)
      if (result.id) {
        await supabase
          .from('schedule_events')
          .update({ google_calendar_event_id: result.id })
          .eq('id', event.id)
        synced++
      }
    }

    return { success: true, data: synced }
  } catch {
    return { success: false, error: '일괄 동기화 중 오류가 발생했습니다' }
  }
}
