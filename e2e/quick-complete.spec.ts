import { test, expect } from '@playwright/test'
import { supabase, cleanupE2EStudents } from './helpers/supabase'

const TEST_ID = Date.now().toString(36)
const STUDENT_NAME = `E2E_${TEST_ID}_QC`
const SCHOOL_NAME = `E2E학교_${TEST_ID}`

let studentId: string
let todayEventId: string
let overdueEventId: string
let mobileEventId: string

test.describe('대시보드 원탭 수업 마감', () => {
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

    // 오늘 수업 카드에서 마감 테스트용: 아직 시작 전인 오늘 수업
    const { data: todayEvent, error: todayError } = await supabase
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
    if (todayError || !todayEvent) {
      throw new Error(`테스트 수업(오늘) 생성 실패: ${todayError?.message}`)
    }
    todayEventId = todayEvent.id

    // 미완료 수업 카드에서 노트 저장 테스트용: 이미 지난 오늘 수업
    const { data: overdueEvent, error: overdueError } = await supabase
      .from('schedule_events')
      .insert({
        student_id: studentId,
        event_type: 'lesson',
        start_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
      })
      .select('id')
      .single()
    if (overdueError || !overdueEvent) {
      throw new Error(`테스트 수업(미완료) 생성 실패: ${overdueError?.message}`)
    }
    overdueEventId = overdueEvent.id

    // 모바일 터치 타깃 테스트 전용: 다른 테스트의 상태 변경과 독립적인 별도 수업
    const { data: mobileEvent, error: mobileError } = await supabase
      .from('schedule_events')
      .insert({
        student_id: studentId,
        event_type: 'lesson',
        start_at: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
      })
      .select('id')
      .single()
    if (mobileError || !mobileEvent) {
      throw new Error(`테스트 수업(모바일) 생성 실패: ${mobileError?.message}`)
    }
    mobileEventId = mobileEvent.id
  })

  test.afterAll(async () => {
    await cleanupE2EStudents()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('오늘 수업 카드 — 완료 버튼 탭 한 번으로 마감된다', async ({ page }) => {
    const card = page.locator(`[data-testid="today-lesson-card"][data-event-id="${todayEventId}"]`)
    await expect(card).toBeVisible({ timeout: 10000 })

    const completeButton = card.locator('[data-testid="quick-complete-button"]')
    await expect(completeButton).toBeVisible()
    await completeButton.click()

    await expect(page.getByText('수업이 완료 처리되었습니다')).toBeVisible({ timeout: 10000 })
    await expect(card.locator('[data-testid="quick-complete-done"]')).toBeVisible({ timeout: 10000 })
  })

  test('미완료 수업 카드 — +노트로 확장 후 저장하며 완료', async ({ page }) => {
    const card = page.locator(`[data-testid="incomplete-lesson-card"][data-event-id="${overdueEventId}"]`)
    await expect(card).toBeVisible({ timeout: 10000 })

    await card.locator('[data-testid="quick-complete-note-toggle"]').click()

    const form = card.locator('[data-testid="quick-complete-note-form"]')
    await expect(form).toBeVisible({ timeout: 5000 })

    await form.locator('textarea[name="content"]').fill('E2E 수업 내용 기록')
    await form.locator('textarea[name="homework"]').fill('E2E 숙제')
    await form.locator('textarea[name="next_goal"]').fill('E2E 다음 목표')

    await form.locator('[data-testid="quick-complete-note-submit"]').click()

    await expect(page.getByText('수업 노트와 함께 완료 처리되었습니다')).toBeVisible({ timeout: 10000 })
    await expect(card.locator('[data-testid="quick-complete-done"]')).toBeVisible({ timeout: 10000 })
  })

  test('모바일 뷰포트 — 완료/노트 버튼의 터치 타깃이 44px 이상이다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const card = page.locator(`[data-testid="today-lesson-card"][data-event-id="${mobileEventId}"]`)
    await expect(card).toBeVisible({ timeout: 10000 })

    const completeButton = card.locator('[data-testid="quick-complete-button"]')
    const box = await completeButton.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.height).toBeGreaterThanOrEqual(44)

    const noteToggle = card.locator('[data-testid="quick-complete-note-toggle"]')
    const noteBox = await noteToggle.boundingBox()
    expect(noteBox).toBeTruthy()
    expect(noteBox!.height).toBeGreaterThanOrEqual(44)
  })
})
