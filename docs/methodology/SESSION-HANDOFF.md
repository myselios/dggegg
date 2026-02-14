# Session Handoff Protocol

> 이 문서는 세션 간 컨텍스트 연속성을 보장하기 위한 프로토콜입니다.
> 새 세션이 시작될 때마다 이 프로토콜을 따릅니다.

---

## 새 세션 시작 시 (필수)

### Step 1: 상태 파악 (30초)
```bash
# 1. 브랜치 및 최근 커밋
git branch --show-current
git log --oneline -10

# 2. 빌드 상태
npm run build

# 3. 변경 사항 확인
git status
git diff --stat
```

### Step 2: 문서 읽기 (1분)
```
필수 읽기 (순서대로):
1. CLAUDE.md                                    → 프로젝트 규칙
2. docs/methodology/SPRINT-BOARD.md             → 현재 스프린트 상태
3. docs/methodology/WORKFLOW.md                 → 워크플로우 규칙
4. docs/plans/2026-02-14-rocket-tutor-os-design.md → 설계 문서 (필요 시)
```

### Step 3: 사용자에게 현재 상태 보고
```markdown
## 현재 상태
- 브랜치: {branch}
- 마지막 커밋: {commit}
- 빌드: ✅/❌
- 현재 스프린트: Sprint #{N} - {제목}
- 진행 중 태스크: {목록}
- 다음 할 일: {추천}
```

---

## 세션 종료 시 (필수)

### Step 1: 상태 저장
1. `SPRINT-BOARD.md`의 "현재 스프린트" 섹션 업데이트
2. 완료된 태스크 체크, 진행 중 태스크 메모
3. 발견된 이슈 "알려진 이슈" 섹션에 추가

### Step 2: 커밋
```bash
git add docs/methodology/SPRINT-BOARD.md
git commit -m "[docs] 스프린트 보드 상태 업데이트"
```

### Step 3: 핸드오프 노트 업데이트
`SPRINT-BOARD.md`의 "세션 핸드오프 노트" 섹션에 다음 세션이 알아야 할 컨텍스트 기록:
- 진행 중이던 작업
- 발생한 문제
- 다음 할 일 추천

---

## 팀 스폰 시 컨텍스트 전달

### 팀원에게 전달할 정보
팀원은 리더의 대화 기록을 상속받지 않습니다. 반드시 프롬프트에 포함:

```
## 필수 컨텍스트
- 프로젝트: Rocket Tutor OS (IB 1인 강사용 통합 운영 시스템)
- 기술 스택: Next.js 16, React 19, TypeScript 5, Tailwind v4, shadcn/ui, Supabase
- 설계 문서: docs/plans/2026-02-14-rocket-tutor-os-design.md
- 스프린트 보드: docs/methodology/SPRINT-BOARD.md
- 워크플로우: docs/methodology/WORKFLOW.md

## 현재 스프린트
Sprint #{N}: {제목}

## 당신의 태스크
{구체적인 태스크 설명 - 수정 파일, 수용 기준 포함}
```

---

## 컨텍스트 압축 시 (/compact)

### /compact 전 체크
- [ ] SPRINT-BOARD.md가 최신 상태인가?
- [ ] 진행 중 작업이 커밋되었는가?
- [ ] 다음 할 일이 명확한가?

### /compact 후 복구
1. SPRINT-BOARD.md 다시 읽기
2. 현재 스프린트 태스크 확인
3. 작업 재개

---

## 에이전트 팀 재구성 시

팀이 종료된 후 재구성할 때:

```
1. TeamCreate (team_name: "rocket-tutor")
2. SPRINT-BOARD.md 읽기 → 현재 스프린트 태스크 확인
3. TaskCreate (백로그에서 태스크 생성)
4. Task tool로 팀원 스폰 (상세 프롬프트 포함)
5. TaskUpdate로 태스크 배정
```
