import { google } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const TIMEZONE = 'Asia/Seoul'
const LOG_PREFIX = '[Google Calendar]'
// Google Calendar colorId: 1=Lavender, 7=Peacock, 9=Blueberry
const DEFAULT_COLOR_ID = '9'

/**
 * Google Calendar 이벤트 제목 생성
 * - 학생 있음: "{student.name_ko} - {template_type}" 또는 "{student.name_ko}"
 * - 학생 없음(메모): event.title 또는 '일정'
 */
export function buildSummary(event: ScheduleEventWithStudent): string {
  if (event.students !== null) {
    const name = event.students.name_ko
    return event.template_type ? `${name} - ${event.template_type}` : name
  }

  return event.title ?? '일정'
}

export type CalendarSyncResult =
  | { readonly id: string }
  | { readonly id: null; readonly error: string }

/**
 * Google Calendar에 이벤트 생성
 * @returns 성공 시 { id }, 실패 시 { id: null, error }
 */
export async function createCalendarEvent(
  event: ScheduleEventWithStudent
): Promise<CalendarSyncResult> {
  try {
    const auth = await getAuthenticatedClient()
    if (auth === null) {
      return { id: null, error: 'Google 연동이 설정되지 않았거나 토큰을 불러올 수 없습니다' }
    }

    const calendar = google.calendar({ version: 'v3', auth })
    const summary = buildSummary(event)

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        colorId: DEFAULT_COLOR_ID,
        start: {
          dateTime: event.start_at,
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: event.end_at,
          timeZone: TIMEZONE,
        },
      },
    })

    if (!response.data.id) {
      return { id: null, error: 'Google에서 이벤트 ID를 반환하지 않았습니다' }
    }
    return { id: response.data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`${LOG_PREFIX} 이벤트 생성 실패:`, message)
    return { id: null, error: message }
  }
}

/**
 * Google Calendar 이벤트 수정
 * @returns 성공 여부
 */
export async function updateCalendarEvent(
  googleEventId: string,
  event: ScheduleEventWithStudent
): Promise<boolean> {
  try {
    const auth = await getAuthenticatedClient()
    if (auth === null) {
      return false
    }

    const calendar = google.calendar({ version: 'v3', auth })
    const summary = buildSummary(event)

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary,
        colorId: DEFAULT_COLOR_ID,
        start: {
          dateTime: event.start_at,
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: event.end_at,
          timeZone: TIMEZONE,
        },
      },
    })

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} 이벤트 수정 실패 (id: ${googleEventId}):`, error)
    return false
  }
}

/**
 * Google Calendar 이벤트 삭제
 * @returns 성공 여부
 */
export async function deleteCalendarEvent(googleEventId: string): Promise<boolean> {
  try {
    const auth = await getAuthenticatedClient()
    if (auth === null) {
      return false
    }

    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    })

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} 이벤트 삭제 실패 (id: ${googleEventId}):`, error)
    return false
  }
}
