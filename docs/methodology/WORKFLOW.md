# Rocket Tutor OS - 에이전트 팀 개발 방법론

> 이 문서는 에이전트 팀의 업무 분배, 워크플로우, 세션 연속성을 정의합니다.
> 새 세션 시작 시 이 파일을 반드시 참조하세요.

## 1. 핵심 원칙

### Plan-First 패턴
```
80% 계획/리뷰 → 20% 구현
```
- Plan 모드에서 저렴하게 계획 수립 (~10k 토큰)
- 계획 승인 후 팀으로 병렬 실행 (~500k+ 토큰)
- 중간에 방향 전환 비용 최소화

### 모델 전략
| 역할 | 모델 | 이유 |
|------|------|------|
| team-lead, pm-analyst, architect, code-reviewer | opus | 깊은 사고, 설계, 리뷰 |
| frontend-dev, backend-dev, ux-designer, qa-engineer | sonnet | 빠른 구현, 비용 효율 |

### 파일 소유권 분리
```
frontend-dev 소유:
  - components/**/*.tsx
  - app/(authenticated)/**/page.tsx (UI 부분)

backend-dev 소유:
  - app/actions/*.ts
  - lib/supabase/*.ts
  - lib/hooks/*.ts
  - lib/types/*.ts
  - supabase/migrations/*.sql

ux-designer 소유:
  - app/globals.css
  - 컴포넌트 스타일 수정 (frontend-dev 협의 후)
```
- 동일 파일 동시 수정 금지
- 소유권 경계를 넘는 작업은 team-lead가 조율

---

## 2. 워크플로우 (3-Phase SDD)

### Phase 1: Planning (기획) 🔵
```
사용자 요청 → pm-analyst(요구사항 분석) → architect(설계) → team-lead(승인)
```

**산출물:**
- PRD (요구사항 + 유저 스토리 + 수용 기준)
- 아키텍처 결정 기록 (ADR)
- 태스크 분해 목록

**게이트:** team-lead + 사용자 승인 후 Phase 2 진입

### Phase 2: Development (개발) 🟢
```
team-lead(태스크 배분) → frontend-dev + backend-dev + ux-designer(병렬 구현)
```

**규칙:**
- 각 팀원에게 5-6개 태스크 배정
- 태스크 의존관계(blockedBy)를 설정하여 순서 보장
- 팀원은 TaskList 폴링 → 작업 청구 → 구현 → 완료 보고

**게이트:** 각 태스크 완료 시 code-reviewer 리뷰

### Phase 3: Verification (검증) 🔴
```
code-reviewer(리뷰) → qa-engineer(테스트) → team-lead(릴리스 승인)
```

**산출물:**
- 코드 리뷰 보고서 (심각도별 분류)
- QA 검증 결과 (빌드 + 기능 + 엣지 케이스)

**게이트:** 🔴 심각 / 🟠 높음 이슈 0건 확인 후 머지

---

## 2.5 Push 전 필수 검증 게이트 🚫

> **이 규칙은 모든 터미널 세션, 모든 에이전트, 모든 브랜치에 예외 없이 적용됩니다.**

### 검증 파이프라인 (순서 필수)

```bash
# Step 1: TypeScript 컴파일 검증
npx tsc --noEmit
# → 에러 0건 필수

# Step 2: ESLint 검증
npm run lint
# → 에러 0건 필수 (warning 허용)

# Step 3: 프로덕션 빌드 검증
npm run build
# → 빌드 성공 필수

# Step 4: E2E 테스트 검증
npm run test:e2e
# → 전체 테스트 통과 필수
```

### 규칙

| 상황 | 필수 Step |
|------|-----------|
| 일반 push | Step 1 + 2 + 3 + 4 전부 |
| 긴급 핫픽스 | 최소 Step 1 + 3 |
| docs만 변경 | 검증 면제 |

### 위반 시

- 검증 미통과 코드는 **push 금지**
- 이미 push된 미검증 코드는 **즉시 revert**
- 테스트 실패 → 코드 수정 → Step 1부터 재실행

### 테스트 작성 의무

| 작업 유형 | 테스트 의무 |
|-----------|-------------|
| 새 기능 추가 | 해당 기능 E2E 테스트 필수 |
| 버그 수정 | 회귀 방지 E2E 테스트 필수 |
| 리팩토링 | 기존 E2E 테스트 통과 필수 |
| UI 변경 | 관련 인터랙션 E2E 테스트 필수 |

### 병렬 터미널 작업 시 추가 규칙

1. **각 터미널은 독립 브랜치에서 작업** (main 직접 수정 금지)
2. **push 전 `git pull --rebase origin main`** 으로 최신 코드 동기화
3. **동일 파일 동시 수정 금지** (파일 소유권 규칙 준수)
4. **merge conflict 발생 시 → 수동 해결 후 Step 1부터 재검증**

---

## 3. 스프린트 구조

### 스프린트 단위
```
Sprint = 하나의 기능 단위 (예: 캘린더 DnD, 학생 검색/필터)
```

### 스프린트 사이클
```
1. Sprint Planning (팀 리더)
   └── SPRINT-BOARD.md 업데이트
   └── 태스크 생성 (TaskCreate)
   └── 팀원 배정

2. Sprint Execution (팀원들)
   └── 병렬 구현
   └── 팀원 간 메시지로 조율

3. Sprint Review (코드리뷰 + QA)
   └── code-reviewer 리뷰
   └── qa-engineer 검증

4. Sprint Retrospective (팀 리더)
   └── SPRINT-BOARD.md 결과 기록
   └── 다음 스프린트 계획
```

---

## 4. 태스크 작성 가이드

### 좋은 태스크 예시
```markdown
Subject: 캘린더 드래그앤드롭 - 이벤트 시간 변경 구현

Description:
## 목표
3주 캘린더에서 수업 이벤트를 드래그하여 시간/날짜를 변경할 수 있게 한다.

## 수정 파일
- components/schedule/three-week-calendar.tsx (DndContext 추가)
- components/schedule/calendar-event-block.tsx (useDraggable 적용)
- app/actions/schedule.ts (updateScheduleEvent 활용)

## 수용 기준
- [ ] 이벤트를 다른 시간대로 드래그하면 시간이 변경된다
- [ ] 이벤트를 다른 날짜로 드래그하면 날짜가 변경된다
- [ ] 드래그 중 시각적 피드백이 표시된다
- [ ] 변경 후 SWR 캐시가 갱신된다
- [ ] TypeScript 오류 없이 빌드된다

## 참고
- @dnd-kit 문서: https://dndkit.com
- 현재 설치된 패키지: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- 설계 문서 B2 섹션 참조
```

### 나쁜 태스크 예시
```markdown
Subject: DnD 구현
Description: 드래그앤드롭을 구현해주세요
```

---

## 5. 팀 커뮤니케이션 프로토콜

### 메시지 유형
| 유형 | 사용 시점 | 대상 |
|------|----------|------|
| DM (message) | 특정 팀원과 1:1 소통 | 특정 팀원 |
| Broadcast | 긴급 전체 공지 (드물게) | 전체 |
| shutdown_request | 스프린트 완료 후 정리 | 특정 팀원 |

### 보고 규칙
- 태스크 완료 시 → TaskUpdate(completed) + team-lead에게 DM
- 블로커 발생 시 → team-lead에게 즉시 DM
- 다른 팀원 파일 수정 필요 시 → 해당 팀원에게 DM 협의

---

## 6. 에이전트 스폰 패턴

### 기본 패턴
```
Task tool 호출:
  name: "역할명"
  team_name: "rocket-tutor"
  subagent_type: "general-purpose"
  mode: "bypassPermissions"
  prompt: "상세한 역할 + 태스크 지시"
```

### 팀원별 프롬프트 템플릿
```
당신은 [역할]입니다.
프로젝트: Rocket Tutor OS

## 현재 스프린트
Sprint #{N}: {스프린트 제목}

## 당신의 태스크
TaskList를 확인하고, 당신에게 배정된 태스크를 수행하세요.

## 컨텍스트
- 설계 문서: docs/plans/2026-02-14-rocket-tutor-os-design.md
- 구현 계획: docs/plans/2026-02-14-rocket-tutor-os-implementation.md
- 개발 방법론: docs/methodology/WORKFLOW.md
- 스프린트 보드: docs/methodology/SPRINT-BOARD.md

## 규칙
1. 태스크 시작 전 TaskUpdate(in_progress)
2. 완료 후 TaskUpdate(completed) + team-lead에게 보고
3. 블로커 발생 시 team-lead에게 즉시 보고
4. 다른 팀원 소유 파일 수정 금지
```
