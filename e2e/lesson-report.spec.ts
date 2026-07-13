import { test, expect } from '@playwright/test'
import { supabase, cleanupE2EStudents } from './helpers/supabase'

const TEST_ID = Date.now().toString(36)
const STUDENT_NAME = `E2E_${TEST_ID}_RPT`
const SCHOOL_NAME = `E2E학교_${TEST_ID}`

let studentId: string
let eventId: string

test.describe('학부모 리포트 원클릭 복사', () => {
  test.beforeAll(async () => {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({ name_ko: STUDENT_NAME, school: SCHOOL_NAME, status: 'active' })
      .select('id')
      .single()
    if (studentError || !student) {
      throw new Error(`테스트 학생 생성 실패: ${studentError?.message}`)
    }
    studentId = student.id

    const now = new Date()
    const { data: event, error: eventError } = await supabase
      .from('schedule_events')
      .insert({
        student_id: studentId,
        event_type: 'lesson',
        start_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
        status: 'scheduled',
      })
      .select('id')
      .single()
    if (eventError || !event) {
      throw new Error(`테스트 수업 생성 실패: ${eventError?.message}`)
    }
    eventId = event.id
  })

  test.afterAll(async () => {
    if (eventId) {
      await supabase.from('schedule_events').delete().eq('id', eventId)
    }
    await cleanupE2EStudents()
  })

  test('수업 노트 패널에서 기본 템플릿으로 리포트를 복사한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/schedule')
    await page.getByText(STUDENT_NAME).first().click()

    const notePanel = page.getByTestId('lesson-note-panel').or(page.locator('[role="dialog"]'))
    await expect(notePanel.first()).toBeVisible()

    await page.getByTestId('lesson-report-btn').click()
    await expect(page.getByTestId('lesson-report-popover')).toBeVisible()
    await page.getByTestId('lesson-report-template-default').click()

    await expect(page.getByText('복사됨')).toBeVisible()

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain(STUDENT_NAME)
    expect(clipboard).toContain('수업 리포트')
  })
})
