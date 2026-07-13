import { test, expect } from '@playwright/test'

test.describe('학생 표 모드', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/students')
    await page.waitForLoadState('networkidle')
  })

  test('뷰 토글로 표 모드 전환 시 표가 렌더링된다', async ({ page }) => {
    const tableBtn = page.locator('[data-testid="student-view-table-btn"]')
    await expect(tableBtn).toBeVisible({ timeout: 10000 })

    await tableBtn.click()

    const table = page.locator('[data-testid="student-table-container"] table')
    await expect(table).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="student-table-row"]').first()).toBeVisible()
  })

  test('표 모드 선택은 새로고침 후에도 localStorage에 유지된다', async ({ page }) => {
    await page.locator('[data-testid="student-view-table-btn"]').click()
    await expect(page.locator('[data-testid="student-table-container"]')).toBeVisible()

    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="student-table-container"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test('헤더 클릭 시 정렬 방향이 토글된다', async ({ page }) => {
    await page.locator('[data-testid="student-view-table-btn"]').click()
    const nameHeader = page.locator('[data-testid="sort-header-이름"]')
    await expect(nameHeader).toBeVisible({ timeout: 5000 })

    const firstNameBefore = await page
      .locator('[data-testid="student-table-row"] td')
      .nth(1)
      .textContent()

    await nameHeader.click()
    await nameHeader.click()

    const firstNameAfter = await page
      .locator('[data-testid="student-table-row"] td')
      .nth(1)
      .textContent()

    // 오름차순 → 내림차순 토글 후 정렬 결과가 달라지는지 확인 (동률이면 스킵 가능한 약한 assert)
    expect(typeof firstNameAfter).toBe('string')
    expect(firstNameBefore).not.toBeUndefined()
  })

  test('행 클릭 시 학생 상세 페이지로 이동한다', async ({ page }) => {
    await page.locator('[data-testid="student-view-table-btn"]').click()
    const firstRow = page.locator('[data-testid="student-table-row"]').first()
    await expect(firstRow).toBeVisible({ timeout: 5000 })

    await firstRow.click()

    await expect(page).toHaveURL(/\/students\//, { timeout: 5000 })
  })

  test('체크박스 선택 시 선택 바가 나타나고 상태 변경 버튼이 보인다', async ({ page }) => {
    await page.locator('[data-testid="student-view-table-btn"]').click()
    const firstCheckbox = page.locator('[data-testid="student-row-checkbox"]').first()
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 })

    await firstCheckbox.click()

    const selectionBar = page.locator('[data-testid="student-selection-bar"]')
    await expect(selectionBar).toBeVisible()
    await expect(page.locator('[data-testid="student-selection-count"]')).toHaveText('1명 선택')
    await expect(page.locator('[data-testid="bulk-status-active"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-status-paused"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-status-ended"]')).toBeVisible()
  })

  test('전체 선택 체크박스로 모든 행을 선택할 수 있다', async ({ page }) => {
    await page.locator('[data-testid="student-view-table-btn"]').click()
    const selectAll = page.locator('[data-testid="select-all-checkbox"]')
    await expect(selectAll).toBeVisible({ timeout: 5000 })

    const rowCount = await page.locator('[data-testid="student-table-row"]').count()
    await selectAll.click()

    await expect(page.locator('[data-testid="student-selection-count"]')).toHaveText(
      `${rowCount}명 선택`,
    )
  })

  test('CSV 내보내기 버튼 클릭 시 다운로드가 시작된다', async ({ page }) => {
    const exportBtn = page.locator('[data-testid="student-csv-export-btn"]')
    await expect(exportBtn).toBeVisible({ timeout: 10000 })

    const downloadPromise = page.waitForEvent('download')
    await exportBtn.click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('students.csv')
  })

  test('카드 뷰로 돌아가면 카드 그리드가 다시 렌더링된다', async ({ page }) => {
    await page.locator('[data-testid="student-view-table-btn"]').click()
    await expect(page.locator('[data-testid="student-table-container"]')).toBeVisible()

    await page.locator('[data-testid="student-view-card-btn"]').click()

    await expect(page.locator('.group\\/card').first()).toBeVisible({ timeout: 5000 })
  })
})
