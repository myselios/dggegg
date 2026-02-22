import { google } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const TIMEZONE = 'Asia/Seoul'
const LOG_PREFIX = '[Google Calendar]'

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

/**
 * Google Calendar에 이벤트 생성
 * @returns Google 이벤트 ID, 실패 시 null
 */
export async function createCalendarEvent(
  event: ScheduleEventWithStudent
): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient()
    if (auth === null) {
      return null
    }

    const calendar = google.calendar({ version: 'v3', auth })
    const summary = buildSummary(event)

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
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

    return response.data.id ?? null
  } catch (error) {
    console.error(`${LOG_PREFIX} 이벤트 생성 실패:`, error)
    return null
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
