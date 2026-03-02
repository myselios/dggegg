import { test, expect } from '@playwright/test'

test.describe('학생 관리 보드', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/students')
    await page.waitForLoadState('networkidle')
  })

  test('학생 카드가 렌더링된다', async ({ page }) => {
    const cards = page.locator('.group\\/card')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('학생 카드 클릭 → 상세 페이지 이동', async ({ page }) => {
    const firstCard = page.locator('.group\\/card').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    await firstCard.click()

    // 학생 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/students\//, { timeout: 5000 })
  })
})
