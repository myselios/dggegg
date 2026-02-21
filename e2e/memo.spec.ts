import { test, expect } from '@playwright/test'

test.describe('메모 이벤트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForLoadState('networkidle')
  })

  test('빈 셀 클릭 → 메모 탭 선택 → 메모 생성', async ({ page }) => {
    const cell = page.locator('[data-testid="droppable-cell"]').nth(5)
    await cell.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 개인 메모 탭 클릭
    const memoTab = dialog.getByRole('button', { name: '개인 메모' })
    await memoTab.click()

    // 메모 제목 입력
    const titleInput = dialog.locator('input[name="title"]')
    await titleInput.fill('E2E 테스트 메모')

    // 제출
    const submitBtn = dialog.locator('button[type="submit"]')
    await submitBtn.click()

    // 다이얼로그 닫힘 확인
    await expect(dialog).toBeHidden({ timeout: 10000 })
  })

  test('메모 이벤트에 제목이 표시된다', async ({ page }) => {
    // 메모 이벤트 찾기 (노란색 바 = 메모)
    const memoBlocks = page.locator('[data-testid="event-block"]').filter({
      has: page.locator('.bg-yellow-500, .bg-yellow-600')
    })

    const count = await memoBlocks.count()
    if (count === 0) {
      test.skip(true, '메모 이벤트가 없어 테스트를 건너뜁니다')
      return
    }

    // 메모 블록에 텍스트가 있는지 확인 (시간만이 아닌 제목)
    const firstMemo = memoBlocks.first()
    const text = await firstMemo.locator('.font-semibold').textContent()
    expect(text).toBeTruthy()
    // 시간 형식(HH:MM)이 아닌 실제 제목인지 확인
    expect(text).not.toMatch(/^\d{2}:\d{2}/)
  })

  test('메모 클릭 → 삭제 다이얼로그 열림', async ({ page }) => {
    const memoBlocks = page.locator('[data-testid="event-block"]').filter({
      has: page.locator('.bg-yellow-500, .bg-yellow-600')
    })

    const count = await memoBlocks.count()
    if (count === 0) {
      test.skip(true, '메모 이벤트가 없어 테스트를 건너뜁니다')
      return
    }

    // 메모의 왼쪽 색상 바 클릭
    const clickBar = memoBlocks.first().locator('[data-testid="event-click-bar"]')
    await clickBar.click()

    // 메모 편집/삭제 다이얼로그 확인
    const deleteBtn = page.getByRole('button', { name: '메모 삭제' })
    await expect(deleteBtn).toBeVisible({ timeout: 3000 })
  })
})
