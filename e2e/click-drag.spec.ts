import { test, expect } from '@playwright/test'

test.describe('Schedule Event Click vs Drag (영역 분리)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="event-block"]', { timeout: 10000 })
    // Scroll grid so first event is fully visible
    const firstEvent = page.locator('[data-testid="event-block"]').first()
    await firstEvent.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  })

  test('좌측 콘텐츠 영역 클릭 → 패널/다이얼로그 열림', async ({ page }) => {
    const clickBar = page.locator('[data-testid="event-click-bar"]').first()
    await expect(clickBar).toBeVisible({ timeout: 5000 })

    await clickBar.click()

    // 수업이면 기록 패널, 메모면 삭제 다이얼로그가 열림
    const lessonPanel = page.getByRole('button', { name: '완료 (기록 저장)' })
    const memoDialog = page.getByRole('button', { name: '메모 삭제' })
    await expect(lessonPanel.or(memoDialog)).toBeVisible({ timeout: 3000 })
  })

  test('우측 드래그 핸들 클릭 → 팝업 안 열림', async ({ page }) => {
    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    // 우측 끝(드래그 핸들) 클릭 — 드래그 영역이므로 팝업 안 열림
    await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2)
    await page.waitForTimeout(500)

    const popup = page.locator('text=완료 (기록 저장)').or(page.locator('text=수업 취소'))
    await expect(popup).not.toBeVisible()
  })

  test('우측 드래그 핸들에서 드래그 → 오버레이 표시 후 ESC 취소', async ({ page }) => {
    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    // 우측 드래그 핸들에서 드래그 시작
    const startX = box.x + box.width - 4
    const startY = box.y + box.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 50, startY, { steps: 5 })
    await page.waitForTimeout(200)

    const dragOverlay = page.locator('[data-testid="drag-overlay"]')
    await expect(dragOverlay).toBeVisible({ timeout: 1000 })

    // ESC로 취소 (DB 변경 방지)
    await page.keyboard.press('Escape')
    await expect(dragOverlay).toBeHidden({ timeout: 2000 })
  })

  test('드래그 핸들에서 드래그 후 ESC → 오버레이 나타나고 사라진다', async ({ page }) => {
    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    const startX = box.x + box.width - 4
    const startY = box.y + box.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX, startY + 50, { steps: 10 })
    await page.waitForTimeout(300)

    const overlay = page.locator('[data-testid="drag-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 2000 })

    // ESC로 취소 (DB 변경 방지)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await expect(overlay).toBeHidden({ timeout: 2000 })
  })
})
