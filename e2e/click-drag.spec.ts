import { test, expect } from '@playwright/test'

test.describe('Schedule Event Click vs Drag (영역 분리)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="event-block"]', { timeout: 10000 })
  })

  test('왼쪽 색상 바 클릭 → 패널/다이얼로그 열림', async ({ page }) => {
    const clickBar = page.locator('[data-testid="event-click-bar"]').first()
    await expect(clickBar).toBeVisible({ timeout: 5000 })

    await clickBar.click()

    // 수업이면 기록 패널, 메모면 삭제 다이얼로그가 열림
    const lessonPanel = page.getByRole('button', { name: '완료 (기록 저장)' })
    const memoDialog = page.getByRole('button', { name: '메모 삭제' })
    await expect(lessonPanel.or(memoDialog)).toBeVisible({ timeout: 3000 })
  })

  test('콘텐츠 영역 클릭 → 팝업 안 열림 (드래그 영역)', async ({ page }) => {
    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    // 콘텐츠 영역 (중앙) 클릭 — 드래그 영역이므로 팝업 안 열림
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(500)

    const popup = page.locator('text=완료 (기록 저장)').or(page.locator('text=수업 취소'))
    await expect(popup).not.toBeVisible()
  })

  test('콘텐츠 영역 드래그 → 드래그 오버레이 표시', async ({ page }) => {
    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    // 콘텐츠 영역에서 드래그 시작 (8px 이상 이동)
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 50, startY, { steps: 5 })
    await page.waitForTimeout(200)

    const dragOverlay = page.locator('[data-testid="drag-overlay"]')
    await expect(dragOverlay).toBeVisible({ timeout: 1000 })

    await page.mouse.up()
  })

  test('드래그 후 드롭 → 드래그 오버레이가 나타나고 사라진다', async ({ page }) => {
    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    // 콘텐츠 영역에서 드래그 시작 (8px 이상 이동)
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX, startY + 50, { steps: 10 })
    await page.waitForTimeout(300)

    // 드래그 오버레이 확인
    const overlay = page.locator('[data-testid="drag-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 2000 })

    // 드롭
    await page.mouse.up()
    await page.waitForTimeout(500)
    await expect(overlay).toBeHidden({ timeout: 2000 })
  })
})
