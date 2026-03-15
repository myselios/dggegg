import { test, expect } from '@playwright/test'

test.describe('템플릿 보관함', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates')
    await page.waitForLoadState('networkidle')
  })

  test('페이지 타이틀이 렌더링된다', async ({ page }) => {
    await expect(page.getByTestId('page-title')).toHaveText('템플릿 보관함')
  })

  test('새 템플릿 버튼이 상단에 표시된다', async ({ page }) => {
    await expect(page.getByTestId('new-template-btn')).toBeVisible()
  })

  test('새 템플릿 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('new-template-btn')).toBeVisible()
  })

  test('새 템플릿 버튼 클릭 시 다이얼로그가 열린다', async ({ page }) => {
    await page.getByTestId('new-template-btn').click()
    await expect(page.getByTestId('template-title-input')).toBeVisible()
    await expect(page.getByTestId('template-content-input')).toBeVisible()
    await expect(page.getByTestId('template-save-btn')).toBeDisabled()
  })

  test('제목과 내용 입력 시 저장 버튼 활성화', async ({ page }) => {
    await page.getByTestId('new-template-btn').click()
    await page.getByTestId('template-title-input').fill('테스트 제목')
    await page.getByTestId('template-content-input').fill('테스트 내용')
    await expect(page.getByTestId('template-save-btn')).toBeEnabled()
  })

  test('헤더에 템플릿 메뉴가 표시된다', async ({ page }) => {
    await page.goto('/')
    const templateLink = page.locator('a[href="/templates"]')
    await expect(templateLink).toBeVisible()
    await expect(templateLink).toContainText('템플릿')
  })
})
