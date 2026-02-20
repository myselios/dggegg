import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: '비밀번호' }).fill(process.env.AUTH_PASSWORD ?? '1q1q2w2w')
  await page.getByRole('button', { name: '로그인' }).click()

  // 대시보드로 리다이렉트될 때까지 대기
  await expect(page).toHaveURL('/', { timeout: 10_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
