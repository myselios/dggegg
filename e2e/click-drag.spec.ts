import { test, expect } from '@playwright/test'

test.describe('Schedule Event Click vs Drag (영역 분리)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="event-block"]', { timeout: 10000 })
  })

  test('왼쪽 색상 바 클릭 → 수업기록 패널 열림', async ({ page }) => {
    const clickBar = page.locator('[data-testid="event-click-bar"]').first()
    await expect(clickBar).toBeVisible({ timeout: 5000 })

    await clickBar.click()

    // 수업기록 패널이 열렸는지 확인 (버튼 중 하나가 보이면 됨)
    const saveBtn = page.getByRole('button', { name: '완료 (기록 저장)' })
    await expect(saveBtn).toBeVisible({ timeout: 3000 })
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

  test('드래그 후 드롭 → over 타겟 감지 확인', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      if (msg.text().includes('[DND]')) consoleLogs.push(msg.text())
    })

    const eventBlock = page.locator('[data-testid="event-block"]').first()
    const box = await eventBlock.boundingBox()
    if (!box) throw new Error('이벤트 블록을 찾을 수 없습니다')

    // 다른 droppable cell 위치 찾기 (같은 열에서 한 칸 아래)
    const cells = page.locator('[data-testid="droppable-cell"]')
    const cellCount = await cells.count()
    console.log(`droppable cell 개수: ${cellCount}`)

    // 현재 이벤트 아래에 있는 빈 셀 찾기
    let targetBox = null
    for (let i = 0; i < cellCount; i++) {
      const cellBox = await cells.nth(i).boundingBox()
      if (cellBox && cellBox.y > box.y + box.height + 20) {
        targetBox = cellBox
        break
      }
    }

    if (!targetBox) {
      console.log('아래쪽 빈 셀을 찾을 수 없어 위로 드래그')
      // 위쪽으로 드래그
      for (let i = 0; i < cellCount; i++) {
        const cellBox = await cells.nth(i).boundingBox()
        if (cellBox && cellBox.y < box.y - 20) {
          targetBox = cellBox
        }
      }
    }

    if (!targetBox) throw new Error('드롭 가능한 셀을 찾을 수 없습니다')

    console.log(`드래그: (${box.x + box.width/2}, ${box.y + box.height/2}) → (${targetBox.x + targetBox.width/2}, ${targetBox.y + targetBox.height/4})`)

    // 콘텐츠 영역에서 드래그 (왼쪽 바 피해서)
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2
    const endX = targetBox.x + targetBox.width / 2
    const endY = targetBox.y + targetBox.height / 4

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // 천천히 이동 (steps로 부드럽게)
    await page.mouse.move(endX, endY, { steps: 20 })
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(1000)

    console.log('DND 로그:')
    consoleLogs.forEach(log => console.log(`  ${log}`))

    // over가 NULL이 아닌지 확인
    const hasOverTarget = consoleLogs.some(log => log.includes('dragEnd') && !log.includes('NULL'))
    expect(hasOverTarget).toBe(true)

    // 서버 업데이트 결과 확인 (추가 대기)
    await page.waitForTimeout(3000)
    console.log('최종 DND 로그:')
    consoleLogs.forEach(log => console.log(`  ${log}`))

    const hasSuccess = consoleLogs.some(log => log.includes('SUCCESS'))
    const hasFailed = consoleLogs.some(log => log.includes('FAILED'))
    console.log(`서버 업데이트: 성공=${hasSuccess}, 실패=${hasFailed}`)
  })
})
