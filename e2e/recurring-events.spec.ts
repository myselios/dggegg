import { test, expect } from '@playwright/test'
import { cleanupE2EMemos } from './helpers/supabase'

test.describe('반복 수업 생성', () => {
  test.afterAll(async () => {
    await cleanupE2EMemos()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForLoadState('networkidle')
  })

  test('수업 탭에서 반복 체크박스를 켜면 반복 옵션이 노출된다', async ({ page }) => {
    const cell = page.locator('[data-testid="droppable-cell"]').nth(5)
    await cell.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 수업 탭이 기본 선택 상태
    const recurringCheckbox = dialog.locator('[data-testid="recurring-checkbox"]')
    await expect(recurringCheckbox).toBeVisible()

    // 반복 옵션은 체크 전에는 숨겨져 있어야 한다
    await expect(dialog.locator('[data-testid="recurring-count-input"]')).toBeHidden()

    await recurringCheckbox.check()

    // 기본값: "N회 반복" 모드, 반복 횟수 입력창 노출
    const countInput = dialog.locator('[data-testid="recurring-count-input"]')
    await expect(countInput).toBeVisible()
    await expect(countInput).toHaveValue('12')

    await dialog.locator('[data-testid="recurring-mode-date"]').click()
    await expect(dialog.locator('[data-testid="recurring-end-date-input"]')).toBeVisible()
    await expect(countInput).toBeHidden()
  })

  test('개인 메모 탭에는 반복 옵션이 노출되지 않는다', async ({ page }) => {
    const cell = page.locator('[data-testid="droppable-cell"]').nth(6)
    await cell.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const memoTab = dialog.getByRole('button', { name: '개인 메모' })
    await memoTab.click()

    await expect(dialog.locator('[data-testid="recurring-checkbox"]')).toBeHidden()
  })

  test('학생을 선택하고 반복(N회) 설정 후 저장하면 반복 수업이 등록된다', async ({ page }) => {
    const cell = page.locator('[data-testid="droppable-cell"]').nth(7)
    await cell.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const studentSelect = dialog.getByRole('combobox').first()
    await studentSelect.click()

    const firstOption = page.getByRole('option').first()
    const hasStudent = await firstOption.isVisible().catch(() => false)
    if (!hasStudent) {
      test.skip(true, '등록된 학생이 없어 테스트를 건너뜁니다')
      return
    }
    await firstOption.click()

    await dialog.locator('[data-testid="recurring-checkbox"]').check()

    const countInput = dialog.locator('[data-testid="recurring-count-input"]')
    await countInput.fill('3')

    const submitBtn = dialog.locator('button[type="submit"]')
    await expect(submitBtn).toHaveText('반복 수업 추가')
    await submitBtn.click()

    // 성공 시 다이얼로그가 닫히고 등록 건수 토스트가 노출된다
    await expect(dialog).toBeHidden({ timeout: 10000 })
    await expect(page.getByText(/반복 수업 \d+회가 등록되었습니다/)).toBeVisible({ timeout: 5000 })
  })

  test('반복 미체크 시 기존 단건 수업 생성 동작이 유지된다', async ({ page }) => {
    const cell = page.locator('[data-testid="droppable-cell"]').nth(8)
    await cell.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const submitBtn = dialog.locator('button[type="submit"]')
    await expect(submitBtn).toHaveText('수업 추가')
  })
})
