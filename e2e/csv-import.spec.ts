import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { cleanupE2EStudents } from './helpers/supabase'

const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const TEST_ID = Date.now().toString(36)

// 테스트별 고유 이름으로 DB 충돌 방지
const STUDENT_A = `E2E_${TEST_ID}_A`
const STUDENT_B = `E2E_${TEST_ID}_B`
const STUDENT_C = `E2E_${TEST_ID}_C`
const SCHOOL_SHARED = `E2E학교_${TEST_ID}`
const SCHOOL_EN = `E2ESchool_${TEST_ID}`

test.describe('학생 CSV 임포트', () => {
  test.beforeAll(() => {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true })

    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'valid-students.csv'),
      `\uFEFF이름,학교,거주지,학년\n${STUDENT_A},${SCHOOL_SHARED},서울,G10\n${STUDENT_B},${SCHOOL_SHARED},부산,G11\n`,
      'utf-8',
    )

    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'missing-name.csv'),
      '\uFEFF이름,학교,거주지,학년\n,테스트학교,서울,G10\n',
      'utf-8',
    )

    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'english-headers.csv'),
      `\uFEFFname,school,residence,grade\n${STUDENT_C},${SCHOOL_EN},인천,G9\n`,
      'utf-8',
    )
  })

  test.afterAll(async () => {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true })
    await cleanupE2EStudents()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/students')
    await page.waitForLoadState('networkidle')
  })

  test('CSV 가져오기 버튼이 보인다', async ({ page }) => {
    const csvButton = page.getByRole('button', { name: 'CSV 가져오기' })
    await expect(csvButton).toBeVisible()
  })

  test('CSV 가져오기 다이얼로그가 열린다', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('CSV 파일로 학생 일괄 추가')).toBeVisible()
    await expect(dialog.getByText('샘플 CSV 다운로드')).toBeVisible()
  })

  test('유효한 CSV 파일 업로드 → 미리보기 표시', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    const fileInput = dialog.locator('input[type="file"]')

    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-students.csv'))

    // 미리보기 테이블에 학생 이름 표시
    await expect(dialog.getByText(STUDENT_A)).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText(STUDENT_B)).toBeVisible()
    await expect(dialog.getByText(SCHOOL_SHARED).first()).toBeVisible()

    // 추가 건수 표시
    await expect(dialog.getByText('추가 2건')).toBeVisible()

    // 추가하기 버튼
    await expect(dialog.getByRole('button', { name: '2명 추가하기' })).toBeEnabled()
  })

  test('필수 필드 누락 CSV → 파싱 오류 표시', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    const fileInput = dialog.locator('input[type="file"]')

    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'missing-name.csv'))

    await expect(dialog.getByText('파싱 오류')).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText(/이름이 비어있습니다/)).toBeVisible()
  })

  test('영문 헤더 CSV도 인식한다', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    const fileInput = dialog.locator('input[type="file"]')

    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'english-headers.csv'))

    await expect(dialog.getByText(STUDENT_C)).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText(SCHOOL_EN)).toBeVisible()
  })

  test('CSV로 학생 일괄 추가 → 성공', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    const fileInput = dialog.locator('input[type="file"]')

    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-students.csv'))
    await expect(dialog.getByRole('button', { name: '2명 추가하기' })).toBeEnabled({ timeout: 5000 })

    await dialog.getByRole('button', { name: '2명 추가하기' }).click()

    // 다이얼로그 닫힘 확인
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // 학생 목록에 표시 확인
    await expect(page.getByText(STUDENT_A)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(STUDENT_B)).toBeVisible()
  })

  test('이미 존재하는 학생 CSV → 중복 건너뛰기 표시', async ({ page }) => {
    // 위 테스트에서 추가된 학생이 있으므로 같은 CSV를 다시 업로드
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    const fileInput = dialog.locator('input[type="file"]')

    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-students.csv'))

    await expect(dialog.getByText(/중복 건너뛰기/)).toBeVisible({ timeout: 5000 })
  })

  test('다시 선택 버튼으로 파일 재선택', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV 가져오기' }).click()

    const dialog = page.getByRole('dialog')
    const fileInput = dialog.locator('input[type="file"]')

    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-students.csv'))
    await expect(dialog.getByText(STUDENT_A)).toBeVisible({ timeout: 5000 })

    await dialog.getByRole('button', { name: '다시 선택' }).click()

    await expect(dialog.getByText('CSV 파일을 선택하거나 드래그하세요')).toBeVisible()
  })
})
