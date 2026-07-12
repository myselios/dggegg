# 코드베이스 정리 및 리팩토링 계획서

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** dggegg(로켓튜터 OS) 저장소에서 (1) 미사용 파일·컴포넌트·의존성을 제거하고 (2) 800줄 초과 위험이 있는 대형 파일을 800줄 이하로 안전 리팩토링해 유지보수성을 회복한다.

**Architecture:** 3-단계 진행. Phase 1은 순수 삭제(리스크 낮음, 커밋 단위 세분화 → 이슈 발생 시 즉시 revert). Phase 2는 shadcn wrapper 정리에 딸린 의존성 정리. Phase 3은 대형 파일 분리(구현 로직/훅/UI 컴포넌트 분리, 동작 변경 없음). 각 Task 완료 시 CLAUDE.md의 Push 전 4단계 게이트(tsc → lint → build → e2e)를 반드시 통과한다.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Supabase · SWR · @dnd-kit · Recharts · Playwright

---

## 감사 결과 요약 (2026-07-13)

| 카테고리 | 대상 | 조치 |
|---------|------|-----|
| 🗑️ **미사용 스크립트** | `fetch-footer.mjs`, `fetch-footer2.mjs`, `fetch-footer3.mjs`, `fetch-footer4.mjs`, `screenshot-local-footer.mjs` | Phase 1.1 삭제 |
| 🗑️ **미사용 루트 파일** | `proxy.ts` (어디에서도 import 안 됨), `prd.backup.json` (구 프로젝트 스냅샷) | Phase 1.2 삭제 |
| 🗑️ **미사용 shadcn 컴포넌트** | `components/ui/{calendar,command,dropdown-menu,popover,sonner}.tsx` (총 954줄) | Phase 1.3 삭제 |
| 📦 **미사용 의존성** | `react-day-picker`, `cmdk`, `next-themes` (전부 위 5개 wrapper에만 딸린 종속) | Phase 2.1 제거 |
| 🧹 **빈 디렉토리** | `.ai-auto/wave-results/` (내용물 없음) | Phase 1.2 함께 정리 |
| 🔀 **대형 파일 (400줄+)** | `three-week-calendar.tsx` (481), `student-csv-import-dialog.tsx` (425), `actions/materials.ts` (360), `dashboard/lesson-stats.tsx` (339), `materials/lesson-materials-section.tsx` (323) | Phase 3 분리 |
| ✅ **정상 판정** | 모든 `app/actions/*` export, hooks, utils, types, migrations, `any`/`@ts-ignore` 0건 | 조치 없음 |

**전체 예상 감소량:** 파일 12개 삭제 + 대형 파일 5개 분리(파일 수 증가 대신 파일당 200-350줄로 균질화)

---

## Phase 0: 사전 준비

### Task 0.1: 정리 브랜치 생성

**Files:**
- Create branch: `refactor/cleanup-2026-07-13`

**Step 1: 현재 상태 확인**

Run: `git status && git log --oneline -3`
Expected: 브랜치가 `main`이고 최신 커밋이 `30f446a`인지 확인

**Step 2: 미커밋 변경사항 처리 결정**

현재 미커밋 변경(`package-lock.json` 수정 + 5개 `fetch-*.mjs` untracked):
- `.mjs` 파일들은 Phase 1.1에서 삭제 예정이므로 **커밋하지 않음**
- `package-lock.json` 변경은 별도 확인 후 처리

Run: `git diff package-lock.json | head -20`
사용자 판단: 의도한 변경이 아니면 `git checkout -- package-lock.json`으로 되돌린다.

**Step 3: 새 브랜치 생성**

Run:
```bash
git checkout -b refactor/cleanup-2026-07-13
```

**Step 4: 베이스라인 검증**

Run:
```bash
npx tsc --noEmit
npm run lint
npm run build
```
Expected: 3개 모두 에러 0건. **실패 시 정리 시작 전에 우선 수정.**

---

## Phase 1: 미사용 파일·컴포넌트 삭제

### Task 1.1: 루트 정리 — 미사용 스크립트 5개 삭제

**Files:**
- Delete: `fetch-footer.mjs`, `fetch-footer2.mjs`, `fetch-footer3.mjs`, `fetch-footer4.mjs`, `screenshot-local-footer.mjs`

**Step 1: 마지막 확인 — 어디서도 참조하지 않는지**

Run:
```bash
grep -rn "fetch-footer\|screenshot-local-footer" . \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  --exclude="*.md" 2>/dev/null
```
Expected: 결과 없음(문서 제외).

**Step 2: 삭제**

Run:
```bash
rm fetch-footer.mjs fetch-footer2.mjs fetch-footer3.mjs fetch-footer4.mjs screenshot-local-footer.mjs
```

**Step 3: 검증**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 0건(이 파일들은 원래 tracked 아니었으므로 아무 영향 없음).

**Step 4: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
[chore] 미사용 footer 스크레이핑 스크립트 5개 제거

- fetch-footer{,2,3,4}.mjs, screenshot-local-footer.mjs 삭제
- 과거 도화스피치 footer 조사용 일회성 스크립트로 현재 참조 없음

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: 루트 정리 — proxy.ts, prd.backup.json, 빈 디렉토리

**Files:**
- Delete: `proxy.ts`, `prd.backup.json`
- Delete: `.ai-auto/wave-results/` (빈 디렉토리)

**Step 1: proxy.ts 미참조 재확인**

Run:
```bash
grep -rn "from ['\"].*proxy['\"]" app components lib --include="*.ts" --include="*.tsx"
grep -rn "middleware" next.config.ts app/layout.tsx 2>/dev/null
```
Expected: 결과 없음(현재 middleware 미도입).

**Step 2: prd.backup.json — 사용자 확인 필요**

이 파일은 이전 프로젝트(`dggegg-materials`)의 PRD 스냅샷. 현재 `prd.json`은 별개 프로젝트(`message-template-library`)를 담고 있음.

**결정 사항 사용자에게 확인:**
- (A) 삭제 — 현재 로켓튜터 OS와 무관
- (B) `docs/archive/prd-2026-03-13.json`으로 이동 — 히스토리 보존

사용자가 (A)를 선택했다면 아래 진행. (B)면 `mv`로 이동 후 커밋.

**Step 3: 삭제**

Run:
```bash
rm proxy.ts prd.backup.json
rmdir .ai-auto/wave-results 2>/dev/null || true
# .ai-auto 자체가 비었다면 함께 정리
rmdir .ai-auto 2>/dev/null || true
```

**Step 4: 검증**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공.

**Step 5: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
[chore] 미사용 루트 파일 및 빈 디렉토리 제거

- proxy.ts: 미도입 middleware 초안, import 참조 없음
- prd.backup.json: 이전 프로젝트 PRD 스냅샷, 현재 프로젝트와 무관
- .ai-auto/wave-results: 빈 디렉토리

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: 미사용 shadcn UI 컴포넌트 5개 삭제

**Files:**
- Delete: `components/ui/calendar.tsx` (220줄)
- Delete: `components/ui/command.tsx` (184줄)
- Delete: `components/ui/dropdown-menu.tsx` (257줄)
- Delete: `components/ui/popover.tsx` (143줄)
- Delete: `components/ui/sonner.tsx` (~50줄)

> ⚠️ **주의:** `sonner.tsx`는 shadcn의 `<Toaster/>` wrapper지만 `app/layout.tsx`가 shadcn wrapper 대신 **패키지에서 직접** `import { Toaster } from "sonner"`를 쓴다. 따라서 wrapper만 삭제해도 토스트 기능은 유지된다.

**Step 1: 각 컴포넌트 미참조 재확인 (한 번에)**

Run:
```bash
for f in calendar command dropdown-menu popover sonner; do
  echo "=== ui/$f ==="
  grep -rn "@/components/ui/$f\|components/ui/$f" app components lib \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "components/ui/$f\.tsx:" || echo "  (미참조 확인)"
done
```
Expected: 5개 전부 `(미참조 확인)`.

**Step 2: 삭제**

Run:
```bash
rm components/ui/calendar.tsx \
   components/ui/command.tsx \
   components/ui/dropdown-menu.tsx \
   components/ui/popover.tsx \
   components/ui/sonner.tsx
```

**Step 3: 타입·빌드·린트 검증**

Run:
```bash
npx tsc --noEmit
npm run lint
npm run build
```
Expected: 3개 모두 성공. 실패 시 즉시 `git checkout .`으로 되돌리고 미처 확인 못 한 import 재조사.

**Step 4: E2E 실행 (토스트가 로그인/설정에서 실제로 동작하는지)**

Run: `npm run test:e2e`
Expected: 전체 통과. 특히 login/settings 시나리오에서 토스트 정상 표시.

**Step 5: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
[refactor] 미사용 shadcn UI wrapper 5개 제거

- ui/{calendar,command,dropdown-menu,popover,sonner}.tsx 삭제
- 총 954줄 감소, import 참조 0건 검증
- sonner 토스트는 app/layout.tsx에서 패키지 직접 사용 중이므로 영향 없음

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: 미사용 의존성 정리

### Task 2.1: 딸린 npm 패키지 제거

**Files:**
- Modify: `package.json`, `package-lock.json`

Phase 1.3에서 삭제한 5개 wrapper가 유일하게 참조하던 패키지들:

| 패키지 | 참조 위치 | 상태 |
|--------|----------|------|
| `react-day-picker` | `ui/calendar.tsx` | 이제 미사용 |
| `cmdk` | `ui/command.tsx` | 이제 미사용 |
| `next-themes` | `ui/sonner.tsx` | 이제 미사용 |

`radix-ui`(dropdown/popover/dialog 등 통합 패키지)는 남은 컴포넌트(`dialog`, `alert-dialog`, `select`, `sheet`, `tabs`, `label`, `avatar`, `separator`)가 계속 사용하므로 **유지**.

**Step 1: 각 패키지 실제 미참조 확인**

Run:
```bash
grep -rn "react-day-picker\|from ['\"]cmdk['\"]\|next-themes" \
  app components lib --include="*.ts" --include="*.tsx" 2>/dev/null
```
Expected: 결과 없음.

**Step 2: 제거**

Run:
```bash
npm uninstall react-day-picker cmdk next-themes
```

**Step 3: 검증**

Run:
```bash
npx tsc --noEmit
npm run lint
npm run build
```
Expected: 3개 모두 성공.

**Step 4: E2E**

Run: `npm run test:e2e`
Expected: 전체 통과.

**Step 5: 커밋**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
[chore] Phase 1 정리로 미사용화된 npm 의존성 3개 제거

- react-day-picker (ui/calendar wrapper 삭제로 미사용)
- cmdk (ui/command wrapper 삭제로 미사용)
- next-themes (ui/sonner wrapper 삭제로 미사용)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: 대형 파일 리팩토링

> **원칙:** 동작 변경 없음. 각 태스크는 (1) 관심사 분리 → (2) `tsc/lint/build/e2e` 통과 → (3) 커밋. 파일당 하나의 커밋으로 revert 용이하게 관리.

### Task 3.1: `three-week-calendar.tsx` 분리 (481 → ~300 + 두 개 헬퍼)

**현재 책임:** 3주 캘린더 그리드 + 07:00-23:00 타임 슬롯 + drag & drop + 이벤트 블록 렌더 + 팝업 개설. 훅과 로컬 헬퍼가 뒤섞여 있음.

**분리 계획:**

**Files:**
- Modify: `components/schedule/three-week-calendar.tsx` (그리드 컨테이너·상태·핸들러만 남김)
- Create: `components/schedule/hooks/use-calendar-dnd.ts` (드래그 상태 훅 + sensors + handleDragEnd)
- Create: `lib/utils/calendar-grid.ts` (시간대·주차 계산 pure 함수)

**Step 1: 현재 파일 정독**

Run: 파일 전체 읽기 후 아래 세 그룹으로 라인 표시
- (A) 시간 슬롯/그리드 좌표 계산 (pure 로직) → `lib/utils/calendar-grid.ts`
- (B) `useState`/`useSensors`/`handleDragStart/End` (드래그 상태) → 훅
- (C) JSX 렌더링 (그대로)

**Step 2: 순수 함수부터 추출 (사이드이펙트 없음, 가장 안전)**

`getTimeSlots()`, `getSlotPosition(event)`, `getWeekIndex(date)` 등 pure 함수만 `lib/utils/calendar-grid.ts`로 이동. 원본에는 `import`만 남긴다.

**Step 3: 타입·빌드 검증**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공.

**Step 4: 드래그 훅 추출**

`useCalendarDnd(events, onEventDrop)` 훅을 만들고 `useState/useSensors/handleDragStart/handleDragEnd/handleDragCancel`을 이동. 반환값: `{ activeId, sensors, onDragStart, onDragEnd, onDragCancel }`.

**Step 5: 원본 파일에서 훅 사용**

`three-week-calendar.tsx` 상단에서 `const dnd = useCalendarDnd(...)` 호출하고 `<DndContext {...dnd}>` 형태로 축약.

**Step 6: 검증**

Run:
```bash
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e -- --grep "schedule\|calendar"
```
Expected: 전부 통과. E2E는 드래그 시나리오 필수.

**Step 7: 커밋**

```bash
git commit -m "[refactor] three-week-calendar 순수 로직/DnD 훅 분리 (481→~300줄)"
```

---

### Task 3.2: `student-csv-import-dialog.tsx` 분리 (425 → ~250 + 파서 모듈)

**현재 책임:** CSV 파싱 + 컬럼 매핑 UI + 중복 검증 + 배치 저장 + 진행률 표시.

**Files:**
- Modify: `components/students/student-csv-import-dialog.tsx` (UI + 상태만)
- Create: `lib/utils/csv-parser.ts` (parseStudentCsv, normalizeRow, detectDuplicates — pure 함수)
- Create: `lib/utils/csv-parser.test.ts` (unit test — 필수, 파서 회귀 방지)

**Step 1: 실패 테스트 먼저 작성 (TDD)**

`lib/utils/csv-parser.test.ts`에 최소 3개 케이스:
- 정상 CSV 파싱
- BOM/따옴표 포함 CSV
- 중복 학생 감지

> 현재 프로젝트에 unit test runner가 없다면 이 Task를 시작할 때 vitest 도입 여부를 먼저 결정한다. (없이 진행할 경우 E2E만으로 검증하되, 이후 Task에서 vitest 도입을 별도 이슈로 남긴다.)

**Step 2: 파서 함수 추출**

CSV 관련 pure 함수를 `lib/utils/csv-parser.ts`로 이동. dialog 컴포넌트는 `parseStudentCsv(text)`를 호출만 한다.

**Step 3: 검증 & 커밋**

```bash
npx tsc --noEmit && npm run lint && npm run build
npm run test:e2e -- --grep "csv\|import"
git commit -m "[refactor] student CSV 파서 pure 함수 분리 (425→~250줄)"
```

---

### Task 3.3: `app/actions/materials.ts` 분리 (360 → ~240 + Gemini 서비스)

**현재 책임:** Material CRUD + 파일 업로드 + Student Docs + 진도 계산 + **Gemini 요약**.

**Files:**
- Modify: `app/actions/materials.ts` (Server Action만 유지)
- Modify: `lib/google/gemini.ts` (요약 로직 흡수 — 이미 존재하는 파일)
- Create: `lib/services/material-progress.ts` (진도율 계산 pure 함수)

**Step 1: 진도 계산 함수 이동**

`calculateProgress`, `aggregateSessions` 등 pure 함수를 `lib/services/material-progress.ts`로 이동.

**Step 2: Gemini 호출을 `lib/google/gemini.ts`로 흡수**

Server Action 내부의 `generateContent` 호출을 `lib/google/gemini.ts`의 함수(예: `summarizeMaterial(text)`)로 캡슐화. Action은 결과만 받는다.

**Step 3: 검증 & 커밋**

```bash
npx tsc --noEmit && npm run lint && npm run build
npm run test:e2e -- --grep "material"
git commit -m "[refactor] materials action에서 Gemini 호출과 진도 계산 분리 (360→~240줄)"
```

---

### Task 3.4: `dashboard/lesson-stats.tsx` 분리 (339 → ~220 + 집계 훅 + 차트)

**Files:**
- Modify: `components/dashboard/lesson-stats.tsx`
- Create: `components/dashboard/lesson-stats/stat-cards.tsx` (숫자 카드 4개)
- Create: `components/dashboard/lesson-stats/trend-chart.tsx` (Recharts 라인)
- Create: `lib/hooks/use-lesson-stats.ts` (주간/월간 집계 훅)

**Step 1: 집계 로직을 훅으로**

`useMemo` 블록에서 계산되는 aggregation을 `useLessonStats(events, range)` 훅으로 옮긴다.

**Step 2: 차트/카드 컴포넌트 분리**

각 하위 컴포넌트에 `data` 프롭만 전달.

**Step 3: 검증 & 커밋**

```bash
npx tsc --noEmit && npm run lint && npm run build
npm run test:e2e -- --grep "dashboard"
git commit -m "[refactor] lesson-stats를 집계 훅 + 차트/카드 컴포넌트로 분리 (339→~220줄)"
```

---

### Task 3.5: `materials/lesson-materials-section.tsx` 분리 (323 → ~200 + dialogs)

**Files:**
- Modify: `components/materials/lesson-materials-section.tsx`
- Move logic (이미 존재): `components/materials/upload-material-dialog.tsx`, `link-dialog.tsx`

**Step 1: 남아있는 인라인 dialog/폼 상태를 기존 컴포넌트로 이동**

두 dialog 컴포넌트가 이미 존재하므로 section 내부에 남아있는 dialog 상태·핸들러를 각 컴포넌트로 흡수.

**Step 2: 검증 & 커밋**

```bash
npx tsc --noEmit && npm run lint && npm run build
npm run test:e2e -- --grep "material"
git commit -m "[refactor] lesson-materials-section의 dialog 상태를 각 컴포넌트로 위임 (323→~200줄)"
```

---

## Phase 4: 최종 검증 및 문서화

### Task 4.1: 전체 검증 게이트 실행

**Step 1: CLAUDE.md의 Push 전 4단계 게이트**

Run(순차):
```bash
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```
Expected: 4개 모두 에러 0건.

**Step 2: 파일 크기 재측정**

Run:
```bash
find app components lib -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -exec wc -l {} + | sort -rn | head -15
```
Expected: 400줄 초과 파일 0건.

**Step 3: 의존성 그래프 재검토**

Run:
```bash
grep -rn "react-day-picker\|cmdk\|next-themes" package.json
```
Expected: 결과 없음.

---

### Task 4.2: SPRINT-BOARD 업데이트

**Files:**
- Modify: `docs/methodology/SPRINT-BOARD.md`

**Step 1: 완료 태스크 추가**

정리·리팩토링 3개 Phase 완료 사실을 스프린트 보드에 기록. 감소량(파일 12개 삭제, 대형 파일 5개 분리, 의존성 3개 제거)을 요약.

**Step 2: 세션 핸드오프 노트**

`docs/methodology/SESSION-HANDOFF.md`(존재 시)에 다음 세션이 알아야 할 내용:
- 새 헬퍼 위치(`lib/utils/calendar-grid.ts`, `lib/utils/csv-parser.ts`, `lib/services/material-progress.ts`)
- 새 훅 위치(`lib/hooks/use-lesson-stats.ts`, `components/schedule/hooks/use-calendar-dnd.ts`)

**Step 3: 커밋**

```bash
git commit -m "[docs] 정리·리팩토링 결과 스프린트 보드 및 핸드오프에 반영"
```

---

### Task 4.3: PR 생성 (선택)

정리 브랜치를 main에 병합할지, PR로 리뷰를 받을지 사용자 결정.

**Option A — 자동 main push (CLAUDE.md 규정):**
```bash
git checkout main
git merge refactor/cleanup-2026-07-13 --ff-only
git push origin main
```

**Option B — PR 생성:**
```bash
git push -u origin refactor/cleanup-2026-07-13
gh pr create --title "정리: 미사용 파일/의존성 제거 + 대형 파일 분리 리팩토링" \
  --body "$(cat <<'EOF'
## Summary
- 미사용 스크립트/컴포넌트/의존성 정리 (파일 12개 삭제, npm 3개 제거)
- 400줄 초과 파일 5개를 관심사별로 분리 (모두 300줄 이하로 축소)
- 동작 변경 없음

## Test plan
- [x] `npx tsc --noEmit` 통과
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] `npm run test:e2e` 전체 통과
- [x] 400줄 초과 파일 0건 재확인
EOF
)"
```

---

## 리스크 및 롤백 가이드

| 리스크 | 감지 방법 | 롤백 |
|-------|----------|-----|
| shadcn wrapper 삭제 후 특정 화면에서 미탐지 사용 발견 | E2E 실패 or 런타임 오류 | 해당 Task 커밋 revert: `git revert <sha>` |
| 파서·훅 분리 후 미묘한 동작 변화 | E2E 회귀 | Task 3.x 커밋 하나만 revert (파일당 1커밋 원칙 덕분에 부작용 없음) |
| Gemini 요약 결과가 이전과 다름 | 수동 확인 | `lib/google/gemini.ts` 변경 되돌리기 |

---

## 검증 원칙 재확인

- **모든 Task 종료 시** `npx tsc --noEmit && npm run lint && npm run build` 최소 3단계 통과
- **Phase 1.3 · Phase 2 · Phase 3.x 종료 시** `npm run test:e2e` 필수
- **한 Task = 한 커밋** — revert 단위 유지
- 문제가 3회 반복되면 사용자 에스컬레이션 (CLAUDE.md 디버깅 프로토콜)
