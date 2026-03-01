import { test, expect } from '@playwright/test'

test.describe('자료 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/materials')
    await page.waitForLoadState('networkidle')
  })

  test('자료 관리 페이지에 접근할 수 있다', async ({ page }) => {
    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 })
  })

  test('수업교재 탭과 학생자료 탭이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('tab-lesson')).toBeVisible()
    await expect(page.getByTestId('tab-student')).toBeVisible()
  })

  test('수업교재 탭 — OT 포함 8개 슬롯이 표시된다', async ({ page }) => {
    // 수업교재 탭이 기본 선택됨
    const sessionLabels = ['OT', '1회차', '2회차', '3회차', '4회차', '5회차', '6회차', '7회차']
    for (const label of sessionLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })

  test('학생자료 탭으로 전환할 수 있다', async ({ page }) => {
    await page.getByTestId('tab-student').click()
    await expect(page.getByText('학생 선택')).toBeVisible()
  })

  test('수업교재 탭 — 파일 없는 슬롯에 업로드 버튼이 표시된다', async ({ page }) => {
    // 업로드 버튼이 1개 이상 존재해야 함
    const uploadBtns = page.getByRole('button', { name: '업로드' })
    await expect(uploadBtns.first()).toBeVisible({ timeout: 5000 })
  })
})
