# Sprint Board - Rocket Tutor OS

> 이 파일은 프로젝트의 영구 상태를 추적합니다.
> 새 세션 시작 시 반드시 이 파일을 읽어 현재 상태를 파악하세요.
> 스프린트 완료/시작 시 이 파일을 업데이트하세요.

---

## 현재 상태

- **현재 브랜치**: main
- **마지막 커밋**: 4be8779 ([feat] 대시보드 bento grid 리디자인)
- **마지막 빌드**: ✅ 통과 (2026-07-13, Sprint 7 전체)
- **마지막 E2E**: ⚠️ 로컬 auth 환경 이슈로 실행 불가 (baseline에서도 동일 실패, 코드 변경과 무관)
- **DB 마이그레이션**: 012 (enrollment total_sessions/payment_note)까지 작성 — **⚠️ 012는 프로덕션 Supabase SQL Editor에서 수동 적용 필요**
- **진행 중 작업**: 없음 — Sprint 7 (스프레드시트 대체 + 1인 강사 특화) 완료

---

## ✅ Sprint 7: 스프레드시트 대체 UX + 1인 강사 특화 기능
- **상태**: ✅ Completed
- **기간**: 2026-07-13
- **목표**: "시트가 더 편하다"는 주 사용자를 위해 입력 비용 제거 + 시트가 못 주는 가치 추가 (근거: `docs/plans/2026-07-13-product-improvement-proposal.md`)
- **범위 제외**: 다크모드 (사용자 결정)

| # | 기능 | 커밋 |
|---|------|------|
| 1 | 탭 전환 지연 해소 — force-dynamic 제거·정적 셸화 + loading 스켈레톤 + 대시보드 병렬 로드 | 99f4870 |
| 2 | 학생 일괄 상태 변경 + Enrollment 백엔드 (migration 012) | 3cd62fe |
| 3 | 반복 수업 생성 UI (기존 createRecurringEvents 연결, B13 일부) | df1e24e |
| 4 | 학생 표 모드 — 시트형 테이블·정렬·일괄 변경·CSV 내보내기 | 86b43f9 |
| 5 | 대시보드 원탭 수업 마감 (완료✓ + 인라인 노트·점수) | 2692fab |
| 6 | 학부모 리포트 원클릭 복사 (템플릿 치환 → 클립보드) | 84c2cbc |
| 7 | 모바일 하단 탭 바 + PWA 설치 (manifest·아이콘) | 83bcde5 |
| 8 | 수강권(회차·정산) UI — B14 완료 | 9f7248d |
| 9 | 학생 상세 잔손질 — 자료 탭 연결·수강권 탭·필터/상태/취약영역 편집 | c67522b |
| 10 | 대시보드 bento grid 리디자인 (카운트업·hover lift) | 4be8779 |

### Sprint 7 참고
- E2E spec 6개 신규 작성(recurring-events, student-table, quick-complete, lesson-report, enrollment 등) — 로컬 auth 이슈로 미실행, 이슈 해결 후 일괄 실행 필요
- `.githooks/pre-push`가 tsc/lint/build를 push 시점에 강제 (73e4fae)

---

## ✅ Sprint 6: 코드베이스 정리 및 리팩토링
- **상태**: ✅ Completed
- **기간**: 2026-07-13
- **목표**: 미사용 코드 제거 + 400줄 초과 대형 파일 관심사 분리
- **결과**: 파일 12개 삭제, npm 3개 제거, 대형 파일 5개 분리 → **전체 ~718줄 감소** (11,182→10,464), 400줄 초과 파일 0건

| # | 파일 | 변경 내용 | 커밋 |
|---|------|----------|------|
| 1 | `docs/plans/2026-07-13-cleanup-refactor-plan.md` | 정리 계획서 | f227b19, 1a6bb6f |
| 2 | `prd.backup.json` → `docs/archive/prd-2026-03-13.json` | 이전 프로젝트 PRD 아카이브 + 빈 디렉토리 정리 | 20fac96 |
| 3 | `package.json` (Playwright 1.58→1.61.1) | Ubuntu 26.04 chromium 지원 | 33340ea |
| 4 | `components/ui/{calendar,command,dropdown-menu,popover,sonner}.tsx` | 미사용 shadcn wrapper 5개 삭제 (790줄) | aefae83 |
| 5 | `package.json` (react-day-picker, cmdk, next-themes) | 딸린 미사용 npm 3개 제거 | 83120a8 |
| 6 | `components/schedule/three-week-calendar.tsx` + `lib/utils/calendar-grid.ts` + `hooks/use-calendar-dnd.ts` | 481→309줄 (pure 함수 + DnD 훅 분리) | 4b96b35 |
| 7 | `components/students/student-csv-import-dialog.tsx` + `lib/utils/csv-parser.ts` | 425→297줄 (CSV 파서 분리) | d149d93 |
| 8 | `app/actions/materials.ts` + `app/actions/student-materials.ts` | 360→198+166줄 (도메인 분리) | 3eac5eb |
| 9 | `components/dashboard/lesson-stats.tsx` + `lib/utils/lesson-stats.ts` + `lib/hooks/use-lesson-stats.ts` | 339→191줄 (집계 로직 + 컴포지트 훅 분리) | 0276f7d |
| 10 | `components/materials/lesson-materials-section.tsx` + `components/materials/session-slot.tsx` | 323→189줄 (서브 컴포넌트 분리) | 8b00a4e |

### 신규 헬퍼 위치 (다음 세션 참고)
- `lib/utils/calendar-grid.ts` — 캘린더 셀 id 인코딩, 시간 겹침, 뷰모드 그리드 CSS
- `lib/utils/csv-parser.ts` — 학생 CSV 파서 pure 로직
- `lib/utils/lesson-stats.ts` — 수업 통계 집계 pure 함수
- `lib/hooks/use-lesson-stats.ts` — 대시보드 lesson-stats 컴포지트 훅
- `components/schedule/hooks/use-calendar-dnd.ts` — 캘린더 DnD 상태·핸들러 훅
- `app/actions/student-materials.ts` — 학생별 Google Docs 진도 관리 action

---

## ✅ Sprint 5: Google Calendar 동기화
- **상태**: ✅ Completed
- **기간**: 2026-02-22
- **목표**: 수업 생성/수정/삭제 시 Google Calendar 자동 동기화

| # | 파일 | 변경 내용 | 커밋 |
|---|------|----------|------|
| 1 | `package.json` | googleapis 패키지 추가 | 1360e46 |
| 2 | `supabase/migrations/006_google_calendar_sync.sql` | google_calendar_event_id 컬럼 + oauth_tokens 테이블 | 87aac48 |
| 3 | `lib/types/database.ts`, `lib/env.ts` | 타입/환경변수 추가 | 9e83593 |
| 4 | `lib/google/auth.ts` | Google OAuth 인증 모듈 | 162fb48 |
| 5 | `lib/google/calendar.ts` | Calendar API 래퍼 | aecc4e3 |
| 6 | `app/api/auth/google/callback/route.ts` | OAuth 콜백 핸들러 | eaf6c17 |
| 7 | `app/actions/schedule.ts` | 수업 CRUD에 Calendar 동기화 통합 | aca35f8 |
| 8 | `app/actions/google.ts`, `app/(authenticated)/settings/*`, `components/nav/sidebar.tsx` | 설정 페이지 UI | 619b5f4 |
| 9 | Settings 페이지 Suspense 수정 | 빌드 에러 해결 | db60851 |

### 사용을 위한 설정 필요
1. Supabase에서 마이그레이션 006 SQL 실행
2. Google Cloud Console에서 OAuth 클라이언트 생성 + Calendar API 활성화
3. `.env.local`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` 추가
4. 앱 설정 페이지에서 Google Calendar 연동 버튼 클릭

---

## ✅ Sprint 4: UI/UX 전면 디자인 리뉴얼
- **상태**: ✅ Completed
- **기간**: 2026-02-21 ~ 2026-02-22
- **목표**: 전체 UI를 Glassmorphism + Indigo 브랜드 컬러로 모던 리뉴얼

### Phase 1: Minimal Clean 디자인 통일 (2026-02-21)
| # | 파일 | 변경 내용 | 커밋 |
|---|------|----------|------|
| 1 | `app/globals.css` | Indigo 브랜드 컬러 테마 + CSS 변수 | 50f929f |
| 2 | `components/nav/sidebar.tsx` | 사이드바 리디자인 | 50f929f |
| 3 | `components/nav/header.tsx` | 프로스티드 글래스 헤더 | 50f929f |
| 4 | `app/(authenticated)/page.tsx` | 대시보드 통계 카드 | 50f929f |
| 5 | `components/dashboard/today-lessons.tsx` | 아이콘 컨테이너 + 카드 | 50f929f |
| 6 | `components/dashboard/weekly-schedule.tsx` | 아이콘 컨테이너 + 카드 | 50f929f |
| 7 | `components/dashboard/recent-consultations.tsx` | 카드 스타일 통일 | 50f929f |
| 8 | `app/login/page.tsx` | 로그인 컬러 적용 | 50f929f |
| 9 | `components/students/student-board.tsx` | 학생 보드 스타일 | 50f929f |

### Phase 2: 나머지 컴포넌트 통일 (2026-02-21)
| # | 파일 | 변경 내용 | 커밋 |
|---|------|----------|------|
| 10 | `components/schedule/three-week-calendar.tsx` | 캘린더 그리드 shadow | 9ad6e08 |
| 11 | `components/schedule/*.tsx` | 다이얼로그 타이포그래피 | 9ad6e08 |
| 12 | `components/students/student-tabs.tsx` | 학생 상세 헤더 리디자인 | 9ad6e08 |
| 13 | `components/students/student-card.tsx` | 카드 shadow + hover | 9ad6e08 |
| 14 | `app/(authenticated)/materials/page.tsx` | 빈 상태 디자인 | 9ad6e08 |
| 15 | 학생 탭 컴포넌트 (4개) | 수업기록/성적/상담 스타일 | 9ad6e08 |
| 16 | `components/dashboard/incomplete-lessons.tsx` | 아이콘/보더 통일 | 9ad6e08 |

### Phase 3: Glassmorphism 적용 (2026-02-22)
| # | 변경 내용 | 커밋 |
|---|----------|------|
| 17 | `globals.css` — 반투명 카드 + 메쉬 그래디언트 배경 + glass-card 유틸리티 | 55e5854 |
| 18 | 레이아웃 — glass-mesh 배경 (Indigo/Violet/Blue 메쉬) | 55e5854 |
| 19 | 사이드바/헤더 — backdrop-blur-xl + 반투명 보더 | 55e5854 |
| 20 | 대시보드 — 환영/통계/위젯 모두 glass-card | 55e5854 |
| 21 | 로그인 — 강화된 메쉬 배경 + blur-2xl 카드 | 55e5854 |
| 22 | 스케줄 — 캘린더 glass-card + frosted 헤더 | 55e5854 |
| 23 | 학생 — 보드/카드/프로필/탭 전부 glass-card | 55e5854 |
| 24 | 모든 카드 rounded-2xl 통일 | 55e5854 |

### Phase 4: 스케줄 UX 개선 (2026-02-22)
| # | 변경 내용 | 커밋 |
|---|----------|------|
| 25 | 이벤트 블록 텍스트 가시성 개선 (패딩/폰트 축소) | 0ccd053 |
| 26 | 이벤트 블록 클릭/드래그 영역 역전 — 학생 카드 패턴 (좌클릭/우드래그) | 902d19f |
| 27 | 3주 뷰 칸 너비 확대 (min-w 1200→1800px, 시간컬럼 64→52px) | 89c1b42 |
| 28 | 주간 범위 헤더 그리드 정렬 (weeks 배열 + col-span-7) | 7322a71 |

### 병행 완료된 기능/버그 수정
| 커밋 | 타입 | 내용 |
|------|------|------|
| 4a6fac4 | fix | 캘린더 이벤트 duration 표시 + E2E cleanup |
| c89c5ea | style | 캘린더 이벤트 상태별 색상 구분 (완료=emerald) |
| 6976ce4 | fix | 과거 수업 자동 완료 + cancelled/no_show UI 제거 |
| 6a57360 | feat | 수업 등록에 메모 필드 추가, 반복(주) 제거 |
| 1f1280d | fix | E2E 드래그 테스트 DB 변경 방지 |

---

## 완료된 추가 작업 (Sprint 3 이후, Sprint 4 이전)

| 커밋 | 타입 | 내용 |
|------|------|------|
| 91dbc8d | style | 미사용 import 제거 (MapPin, MessageCircle, Video) |
| 1e46514 | feat | 대시보드 이번 주 스케줄 위젯 - 요일 컬럼형으로 개선 |
| e2a6b7a | refactor | 학생 관리 불필요 필드 6개 삭제 |
| b8f826e | feat | 수업 취소 시 즉시 삭제 + IB 과정 3개 추가 |
| 7370505 | fix | 수업 추가 버튼 중복 클릭 방지 |
| 573ebaf | fix | 학생 추가 버튼 중복 클릭 방지 |
| 001c398 | test | Playwright E2E 테스트 환경 셋업 + 스케줄 DnD 테스트 |
| 54c3fff | feat | 터치 드래그 지원 + 모바일 반응형 레이아웃 |
| 3767930 | fix | 스케줄 이벤트 서버사이드 중복 방지 |
| 2975bd4 | feat | 23시 시간대 추가 + 개인 메모 기능 |
| 5ff7268 | fix | 수업 클릭 이벤트 복구 - 드래그와 클릭 충돌 해결 |
| 6472dc8 | fix | 클릭-드래그 영역 분리 + 서버 업데이트 수정 |
| 21f28c3 | fix | 스케줄 셀 클릭 시 분 기본값 0분 |
| 30b73cb | fix | 메모 이벤트 표시 및 클릭 수정 |
| b6e2519 | fix | 버그 3건 수정 + 검증 게이트 방법론 + E2E 안정화 |
| edcb73c | fix | 터치 드래그 inline style + overflow 재수정 |
| 06892ad | style | 이벤트 블록 시간 표시 제거 |
| ef7bce7 | feat | 이벤트 블록 높이를 수업 시간에 비례 |
| 5aa115d | fix | 이벤트 제목 여러 줄 표시 |
| 5b2d420 | fix | 학생카드 클릭/드래그/삭제 영역 분리 |
| 8c2a19a | feat | 학생 CSV 임포트 기능 |
| cfdc6cf | refactor | 디자인 통일 — Minimal Clean 스타일 |
| e4d8927 | test | 학생 관리 보드 E2E 테스트 추가 |
| 50f929f | style | 시각적 디자인 리뉴얼 Phase 1 |

---

## 완료된 스프린트 상세

### Sprint 3: 스케줄 UX 개선 ✅
- **기간**: 2026-02-15
- **완료**: 10분 단위 시간 선택기, DnD 30분 분할, 취소 보강 UX, 컴팩트/확대 모드, 미니캘린더

### Sprint 2: 완성도 향상 ✅
- **기간**: 2026-02-14
- **완료**: 성적 차트, 미니 캘린더, 충돌 감지, 에러 핸들링 통합, 보안 수정 (I5~I7)

### Sprint 1: MVP-0 DoD + 보안 강화 ✅
- **기간**: 2026-02-14
- **완료**: 캘린더/학생 DnD, 검색/필터, RLS, Zod 검증, 인증 헬퍼

### Sprint 0: MVP-0 기반 구현 ✅
- **기간**: 2026-02-14
- **완료**: 전체 15개 태스크 (Supabase 연동 ~ Dashboard ~ UI 세련화)

---

## 백로그 (우선순위순)

### P3 - 낮은 우선순위
| # | 기능 | 담당 | 상태 |
|---|------|------|------|
| B12 | 월간 뷰 전환 | frontend-dev | ⬜ 미시작 |
| B13 | 반복 수업 일괄 수정 | frontend-dev + backend-dev | 🔶 부분 완료 (생성 UI는 Sprint 7에서 완료, 일괄 수정 미구현) |
| B14 | Enrollment 관리 UI | frontend-dev + backend-dev | ✅ 완료 (Sprint 7) |

---

## 알려진 이슈

모든 이슈 해결 완료 (I1~I10). 새로운 이슈 없음.

---

## 세션 핸드오프 노트

> 새 세션에서 이 프로젝트를 이어받을 때 아래를 확인하세요:

1. **현재 브랜치 확인**: `git branch --show-current`
2. **마지막 커밋 확인**: `git log --oneline -5`
3. **빌드 상태 확인**: `npm run build`
4. **E2E 테스트 확인**: `npm run test:e2e`
5. **이 파일의 "현재 상태" 섹션 읽기**
6. **백로그에서 다음 작업 선택**

### 2026-02-22 세션 노트

**완료한 작업 (Sprint 4):**
- Phase 2: 나머지 12개 컴포넌트 Minimal Clean 스타일 통일
- Phase 3: Glassmorphism 전체 사이트 적용 (glass-card, 메쉬 그래디언트, backdrop-blur)
- Phase 4: 스케줄 이벤트 블록 UX 개선
  - 클릭/드래그 영역 역전 (좌측 전체=클릭→팝업, 우측=드래그 핸들)
  - 3주 뷰 칸 너비 확대 (1200→1800px)
  - 주간 범위 헤더 그리드 내부 정렬 (col-span-7)
- 병행: 이벤트 상태 색상, 과거 수업 자동 완료, 메모 필드, E2E DB 변경 방지

**디자인 가이드:**
- 글래스 유틸리티: `glass-card`, `glass-subtle`, `glass-mesh` (globals.css)
- 브랜드 컬러: Indigo oklch(0.5 0.19 265)
- 스타일 상수: `lib/constants/status-styles.ts`

**다음 할 일 후보:**
- 백로그: B12 월간 뷰, B13 반복 수업 일괄 수정, B14 Enrollment 관리 UI
- E2E 테스트 커버리지 확대
