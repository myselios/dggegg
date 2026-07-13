import { test, expect } from '@playwright/test'
import { supabase, cleanupE2EStudents } from './helpers/supabase'

const TEST_ID = Date.now().toString(36)
const STUDENT_NAME = `E2E_${TEST_ID}_ENR`
const SCHOOL_NAME = `E2E학교_${TEST_ID}`

const ALERT_STUDENT_NAME = `E2E_${TEST_ID}_ALERT`
const ALERT_SCHOOL_NAME = `E2E학교_${TEST_ID}_ALERT`

let studentId: string
let alertStudentId: string

test.describe('수강권(회차·정산) 관리', () => {
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

    // 정산 임박 배지 검증 및 대시보드 알림 카드 검증용 학생: 4회 패키지 중 3회 완료
    const { data: alertStudent, error: alertStudentError } = await supabase
      .from('students')
      .insert({ name_ko: ALERT_STUDENT_NAME, school: ALERT_SCHOOL_NAME, status: 'active' })
      .select('id')
      .single()
    if (alertStudentError || !alertStudent) {
      throw new Error(`테스트 학생(정산 임박) 생성 실패: ${alertStudentError?.message}`)
    }
    alertStudentId = alertStudent.id

    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: alertStudentId,
        start_date: startDate,
        lesson_type: '1:1',
        status: 'active',
        total_sessions: 4,
      })
      .select('id')
      .single()
    if (enrollmentError || !enrollment) {
      throw new Error(`테스트 수강권 생성 실패: ${enrollmentError?.message}`)
    }

    const now = new Date()
    const completedEvents = [1, 2, 3].map((i) => ({
      student_id: alertStudentId,
      event_type: 'lesson' as const,
      start_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      status: 'completed' as const,
    }))
    const { error: eventsError } = await supabase.from('schedule_events').insert(completedEvents)
    if (eventsError) {
      throw new Error(`테스트 완료 수업 생성 실패: ${eventsError.message}`)
    }
  })

  test.afterAll(async () => {
    await cleanupE2EStudents()
  })

  test('학생 상세 페이지에서 수강권을 추가하면 목록에 표시된다', async ({ page }) => {
    await page.goto(`/students/${studentId}`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: '수강권' }).click()

    const section = page.getByTestId('enrollment-section')
    await expect(section).toBeVisible({ timeout: 10000 })

    await section.getByTestId('enrollment-add-toggle').click()

    const form = page.getByTestId('enrollment-form')
    await expect(form).toBeVisible()
    await form.getByTestId('enrollment-total-sessions').fill('8')
    await form.getByTestId('enrollment-form-submit').click()

    await expect(page.getByText('수강권이 추가되었습니다')).toBeVisible({ timeout: 10000 })

    const card = page.getByTestId('enrollment-card').first()
    await expect(card).toBeVisible({ timeout: 10000 })
    await expect(card).toContainText('1:1')
  })

  test('무제한 체크 시 회차 없이 수강권이 등록된다', async ({ page }) => {
    await page.goto(`/students/${studentId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: '수강권' }).click()

    await page.getByTestId('enrollment-add-toggle').click()
    const form = page.getByTestId('enrollment-form')
    await form.getByTestId('enrollment-unlimited-checkbox').check()
    await expect(form.getByTestId('enrollment-total-sessions')).toBeDisabled()
    await form.getByTestId('enrollment-form-submit').click()

    await expect(page.getByText('수강권이 추가되었습니다')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('무제한').first()).toBeVisible({ timeout: 10000 })
  })

  test('4회 중 3회 완료된 수강권에는 정산 임박 배지와 진행률이 표시된다', async ({ page }) => {
    await page.goto(`/students/${alertStudentId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: '수강권' }).click()

    const card = page.locator('[data-testid="enrollment-card"]').first()
    await expect(card).toBeVisible({ timeout: 10000 })
    await expect(card.getByTestId('payment-alert-badge')).toHaveText('정산 임박')
    await expect(card.getByTestId('enrollment-progress')).toContainText('3 / 4회 진행')
  })

  test('수강권을 삭제하면 목록에서 제거된다', async ({ page }) => {
    await page.goto(`/students/${studentId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: '수강권' }).click()

    const card = page.locator('[data-testid="enrollment-card"]').first()
    await expect(card).toBeVisible({ timeout: 10000 })

    page.once('dialog', (dialog) => dialog.accept())
    await card.getByTestId('enrollment-delete-button').click()

    await expect(page.getByText('수강권이 삭제되었습니다')).toBeVisible({ timeout: 10000 })
  })

  test('대시보드에 정산 임박 알림 카드가 표시되고 학생 클릭 시 상세 페이지로 이동한다', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const alerts = page.getByTestId('payment-alerts')
    await expect(alerts).toBeVisible({ timeout: 10000 })
    await expect(alerts).toContainText(ALERT_STUDENT_NAME)

    await alerts.getByText(ALERT_STUDENT_NAME).click()
    await expect(page).toHaveURL(`/students/${alertStudentId}`, { timeout: 10000 })
  })
})
