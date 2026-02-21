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

    // 카드 왼쪽(내용) 영역 클릭
    const clickZone = firstCard.locator('.cursor-pointer').first()
    await clickZone.click()

    // 학생 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/students\//, { timeout: 5000 })
  })

  test('드래그 핸들이 존재한다', async ({ page }) => {
    const firstCard = page.locator('.group\\/card').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    // 드래그 핸들 (cursor-grab) 확인
    const dragHandle = firstCard.locator('.cursor-grab')
    await expect(dragHandle).toBeVisible()
  })

  test('드래그 핸들에서 드래그 시작 → 오버레이 표시', async ({ page }) => {
    const firstCard = page.locator('.group\\/card').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    const dragHandle = firstCard.locator('.cursor-grab')
    const box = await dragHandle.boundingBox()
    if (!box) throw new Error('드래그 핸들 위치를 찾을 수 없습니다')

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 50, startY + 50, { steps: 10 })
    await page.waitForTimeout(300)

    // DragOverlay가 표시되는지 확인 (rotate-2 클래스로 식별)
    const overlay = page.locator('.rotate-2')
    const visible = await overlay.isVisible().catch(() => false)

    await page.mouse.up()
    expect(visible).toBe(true)
  })
})
