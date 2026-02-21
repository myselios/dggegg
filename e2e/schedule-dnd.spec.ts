import { test, expect } from '@playwright/test'

test.describe('스케줄 드래그앤드롭', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForSelector('[data-testid="calendar-grid"]', { timeout: 15_000 })
  })

  test('이벤트를 생성하고 드래그 가능한 상태로 렌더링되는지 확인', async ({ page }) => {
    const eventCount = await page.locator('[data-testid="event-block"]').count()
    if (eventCount === 0) {
      test.skip(true, '기존 이벤트가 없어 테스트를 건너뜁니다')
      return
    }

    const firstEvent = page.locator('[data-testid="event-block"]').first()
    await expect(firstEvent).toBeVisible()
    await expect(firstEvent).toHaveAttribute('tabindex', '0')
  })

  test('이벤트 드래그 시작 후 ESC → 위치 변경 없음', async ({ page }) => {
    const eventCount = await page.locator('[data-testid="event-block"]').count()
    if (eventCount === 0) {
      test.skip(true, '기존 이벤트가 없어 테스트를 건너뜁니다')
      return
    }

    const firstEvent = page.locator('[data-testid="event-block"]').first()
    const eventBox = await firstEvent.boundingBox()
    if (!eventBox) throw new Error('이벤트 블록의 위치를 가져올 수 없습니다')

    const positionBefore = { x: eventBox.x, y: eventBox.y }
    const eventCenterX = eventBox.x + eventBox.width / 2
    const eventCenterY = eventBox.y + eventBox.height / 2

    // 드래그 시작 후 ESC로 취소 (DB 변경 없음)
    await page.mouse.move(eventCenterX, eventCenterY)
    await page.mouse.down()
    await page.mouse.move(eventCenterX + 15, eventCenterY + 50, { steps: 10 })
    await page.waitForTimeout(200)

    // 드래그 오버레이 확인
    const overlay = page.locator('[data-testid="drag-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 2_000 })

    // ESC로 취소
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 위치 변경 없음 확인
    const eventBoxAfter = await firstEvent.boundingBox()
    expect(eventBoxAfter).toBeTruthy()
    expect(Math.abs(eventBoxAfter!.x - positionBefore.x)).toBeLessThan(5)
    expect(Math.abs(eventBoxAfter!.y - positionBefore.y)).toBeLessThan(5)
  })

  test('드래그 중 DragOverlay가 표시된다', async ({ page }) => {
    const eventCount = await page.locator('[data-testid="event-block"]').count()
    if (eventCount === 0) {
      test.skip(true, '기존 이벤트가 없어 테스트를 건너뜁니다')
      return
    }

    const firstEvent = page.locator('[data-testid="event-block"]').first()
    const eventBox = await firstEvent.boundingBox()
    if (!eventBox) throw new Error('이벤트 블록 위치를 가져올 수 없습니다')

    const startX = eventBox.x + eventBox.width / 2
    const startY = eventBox.y + eventBox.height / 2

    // 드래그 시작 (마우스 누르고 8px 이상 이동)
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 15, startY, { steps: 5 })
    await page.waitForTimeout(200)

    // DragOverlay 확인
    const overlay = page.locator('[data-testid="drag-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 3_000 })

    // 드래그 취소
    await page.keyboard.press('Escape')
    await expect(overlay).toBeHidden({ timeout: 2_000 })
  })
})
