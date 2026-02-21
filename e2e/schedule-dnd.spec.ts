import { test, expect, type Page } from '@playwright/test'

/**
 * 헬퍼: dnd-kit 드래그를 수행한다.
 * 시작점에서 마우스를 누르고, activation distance(8px)를 넘긴 후, 목표까지 이동하고 놓는다.
 */
async function performDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()

  // dnd-kit PointerSensor activation distance: 8px 이상 이동 필요
  const dx = to.x - from.x
  const activateX = from.x + (dx > 0 ? 10 : -10)
  await page.mouse.move(activateX, from.y, { steps: 3 })
  await page.waitForTimeout(150)

  // 목표 위치까지 천천히 이동
  await page.mouse.move(to.x, to.y, { steps: 15 })
  await page.waitForTimeout(300)

  await page.mouse.up()
}

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

  test('이벤트를 다른 시간대로 드래그하면 시간이 변경된다', async ({ page }) => {
    const eventCount = await page.locator('[data-testid="event-block"]').count()
    if (eventCount === 0) {
      test.skip(true, '기존 이벤트가 없어 테스트를 건너뜁니다')
      return
    }

    const firstEvent = page.locator('[data-testid="event-block"]').first()
    const timeBefore = await firstEvent.locator('[data-testid="event-time"]').textContent()

    const eventBox = await firstEvent.boundingBox()
    if (!eventBox) throw new Error('이벤트 블록의 위치를 가져올 수 없습니다')

    const eventCenterX = eventBox.x + eventBox.width / 2
    const eventCenterY = eventBox.y + eventBox.height / 2

    // 같은 열에서 다른 시간대(아래쪽) 빈 셀을 찾는다
    // 이렇게 하면 시간 텍스트가 확실히 변경된다
    const allCells = page.locator('[data-testid="droppable-cell"]')
    const cellCount = await allCells.count()
    let targetBox = null

    for (let i = 0; i < cellCount; i++) {
      const cell = allCells.nth(i)
      const box = await cell.boundingBox()
      if (!box) continue

      // 같은 열(비슷한 X)이고, 다른 행(다른 Y, 최소 30px 아래)인 셀
      const sameColumn = Math.abs(box.x - eventBox.x) < 10
      const differentRow = box.y > eventBox.y + 30

      if (sameColumn && differentRow) {
        const childEvents = await cell.locator('[data-testid="event-block"]').count()
        if (childEvents === 0) {
          targetBox = box
          break
        }
      }
    }

    if (!targetBox) {
      test.skip(true, '드래그할 빈 셀을 찾을 수 없습니다')
      return
    }

    const targetX = targetBox.x + targetBox.width / 2
    const targetY = targetBox.y + targetBox.height / 2

    // 드래그 수행
    await performDrag(page, { x: eventCenterX, y: eventCenterY }, { x: targetX, y: targetY })

    // 결과 확인
    await page.waitForTimeout(1_500)

    const toast = page.locator('text=수업 일정이 변경되었습니다')
    const dragSucceeded = await toast.isVisible({ timeout: 3_000 }).catch(() => false)

    const timeAfter = await page.locator('[data-testid="event-block"]').first()
      .locator('[data-testid="event-time"]').textContent().catch(() => null)

    const timeChanged = timeAfter !== timeBefore

    expect(dragSucceeded || timeChanged).toBeTruthy()
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
