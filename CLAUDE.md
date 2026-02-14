# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (runs `eslint` with flat config)

## Tech Stack

- Next.js 16 with App Router
- React 19, TypeScript 5 (strict mode)
- Tailwind CSS v4 (CSS-first config via `@import "tailwindcss"` in globals.css)
- shadcn/ui (New York style), lucide-react icons
- Supabase (PostgreSQL + Storage), @supabase/ssr
- SWR (client-side data fetching)
- @dnd-kit (drag & drop), Recharts (charts), date-fns
- ESLint 9 flat config with core-web-vitals + TypeScript rules

## Architecture

- **App Router**: All routes live in `app/` using file-based routing (`page.tsx`, `layout.tsx`)
- **Path alias**: `@/*` maps to project root (e.g., `import X from "@/app/something"`)
- **Styling**: Tailwind v4 with CSS custom properties for theming in `app/globals.css`; dark mode via `prefers-color-scheme`
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font` in `app/layout.tsx`
- **Auth**: Simple password gate (cookie-based, middleware protection)
- **Data**: Server Actions (`app/actions/`) + SWR hooks (`lib/hooks/`)
- **Types**: `lib/types/database.ts` (readonly, immutable pattern)
- **No testing framework** is currently installed

---

## Agent Team Rules (필수 준수)

### 세션 시작 프로토콜
새 세션이 시작되면 반드시 아래 순서로 상태를 파악하세요:
1. `docs/methodology/SPRINT-BOARD.md` 읽기 → 현재 스프린트 상태 파악
2. `git log --oneline -5` → 최근 커밋 확인
3. `npm run build` → 빌드 상태 확인
4. 사용자에게 현재 상태 보고 후 작업 시작

### 세션 종료 프로토콜
세션이 끝나기 전 반드시:
1. `docs/methodology/SPRINT-BOARD.md` 업데이트 (진행 상황, 완료 태스크)
2. 변경 사항 커밋
3. 핸드오프 노트 작성

### 워크플로우 (3-Phase SDD)
```
Phase 1: Planning   → pm-analyst(요구사항) + architect(설계) → Spec Gate 승인
Phase 2: Development → frontend-dev + backend-dev + ux-designer (병렬) → Task Gate
Phase 3: Verification → code-reviewer(리뷰) + qa-engineer(검증) → Release Gate
```

### 파일 소유권 (동일 파일 동시 수정 금지)
| 역할 | 소유 파일 |
|------|----------|
| frontend-dev | `components/**/*.tsx`, `app/(authenticated)/**/page.tsx` |
| backend-dev | `app/actions/*.ts`, `lib/supabase/*.ts`, `lib/hooks/*.ts`, `lib/types/*.ts`, `supabase/**` |
| ux-designer | `app/globals.css`, 스타일 수정 (frontend-dev 협의 후) |

### 태스크 작성 규칙
모든 태스크에 반드시 포함:
- **수정 파일** 목록
- **수용 기준** (체크리스트)
- **의존관계** (blockedBy)

### 모델 전략
- **opus**: team-lead, pm-analyst, architect, code-reviewer (설계/리뷰)
- **sonnet**: frontend-dev, backend-dev, ux-designer, qa-engineer (구현)

### 팀원 스폰 시 필수 컨텍스트
팀원은 리더의 대화 기록을 상속받지 않음. 프롬프트에 반드시 포함:
- 프로젝트 설명 + 기술 스택
- 현재 스프린트 번호 + 목표
- 구체적 태스크 (수정 파일, 수용 기준)
- 참조 문서 경로

### 참조 문서
- 설계: `docs/plans/2026-02-14-rocket-tutor-os-design.md`
- 구현 계획: `docs/plans/2026-02-14-rocket-tutor-os-implementation.md`
- 워크플로우: `docs/methodology/WORKFLOW.md`
- 스프린트 보드: `docs/methodology/SPRINT-BOARD.md`
- 세션 핸드오프: `docs/methodology/SESSION-HANDOFF.md`
