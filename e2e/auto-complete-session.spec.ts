import { test, expect } from '@playwright/test'

// 회귀 테스트: 지난 수업 자동완료(autoCompletePastEvents)가 탭을 새로고침하지
// 않아도 시간이 지나며 계속 재실행되는지 검증한다.
//
// 서버 액션은 서버 프로세스의 실제 시각을 기준으로 판단하므로, Playwright의
// 가상 시계(clock)로 "완료 처리된 수업 상태"까지 확인할 수는 없다 — 가상 시계는
// 브라우저 탭의 타이머만 흉내낸다. 대신 실제 회귀 지점인 "탭을 새로고침하지
// 않아도 자동완료 서버 액션이 주기적으로/재포커스 시 다시 호출되는지"를
// 네트워크 요청 횟수로 검증한다.
test('탭을 새로고침하지 않아도 자동완료 서버 액션이 주기적으로 재실행된다', async ({ page }) => {
  let actionCallCount = 0
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.headers()['next-action']) {
      actionCallCount++
    }
  })

  await page.clock.install()
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const afterInitialLoad = actionCallCount

  // 새로고침 없이 5분 주기(AUTO_COMPLETE_INTERVAL_MS)를 넘겨 가상 시간을 진행시킨다
  await page.clock.fastForward('06:00')
  await page.waitForTimeout(1000)

  expect(actionCallCount).toBeGreaterThan(afterInitialLoad)

  // 탭이 백그라운드로 갔다가 다시 포커스될 때도 재확인되어야 한다
  const beforeRefocus = actionCallCount
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(1000)

  expect(actionCallCount).toBeGreaterThan(beforeRefocus)
})
