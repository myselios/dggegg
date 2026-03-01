# dggegg-materials Architecture

## Overview

과외 관리 앱(dggegg)에 자료관리 기능을 추가한다.
- **수업교재 관리**: OT + 1~7회차 PDF/PPT 파일 업로드 및 링크 복사
- **학생자료 연동**: 학생별 Google Docs URL 등록
- **AI 진도현황**: Google Docs 내용을 Gemini AI가 회차별로 요약

기존 Google OAuth (Calendar), Supabase, Server Actions 패턴을 그대로 확장한다.

---

## Layer Structure

### Presentation Layer
- `app/(authenticated)/materials/page.tsx` — 자료관리 메인 페이지
- `components/materials/lesson-materials-section.tsx` — OT + 1~7회차 교재 카드 목록
- `components/materials/student-docs-section.tsx` — 학생 선택 + Docs URL 관리
- `components/materials/student-progress-card.tsx` — 회차별 AI 요약 카드
- `components/materials/upload-material-dialog.tsx` — 파일 업로드 다이얼로그

### Application Layer (Server Actions)
- `app/actions/materials.ts`
  - `uploadMaterial(session, file)` → 파일 업로드 + DB 저장
  - `deleteMaterial(id)` → 파일 삭제 + DB 제거
  - `getMaterials()` → 교재 목록 조회
  - `saveStudentDocsUrl(studentId, docsUrl)` → Docs URL 저장
  - `getStudentProgress(studentId)` → AI 요약 조회 (캐시 우선)
  - `refreshStudentProgress(studentId)` → 캐시 무효화 + 재요약

### Infrastructure Layer
- `lib/google/docs.ts` — Google Docs API로 문서 내용 읽기 + 회차별 섹션 분리
- `lib/google/gemini.ts` — Gemini API로 섹션 요약
- `lib/google/auth.ts` — 기존 파일에 `documents.readonly` 스코프 추가
- Supabase Storage `materials` 버킷 — PDF/PPT 파일 저장

### Data Layer (Supabase)
```sql
-- 교재 메타데이터
materials (
  id uuid PRIMARY KEY,
  session text NOT NULL,  -- 'OT' | '1' | '2' | ... | '7'
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- 학생별 Google Docs URL
student_docs (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES students(id),
  docs_url text NOT NULL,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id)
)

-- AI 요약 캐시
materials_cache (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES students(id),
  summary_data jsonb NOT NULL,  -- { session: string, summary: string }[]
  cached_at timestamptz DEFAULT now(),
  UNIQUE(student_id)
)
```

---

## Directory Structure

```
app/
  (authenticated)/
    materials/
      page.tsx                      ← 메인 페이지 (플레이스홀더 교체)
  actions/
    materials.ts                    ← Server Actions

components/
  materials/
    lesson-materials-section.tsx
    student-docs-section.tsx
    student-progress-card.tsx
    upload-material-dialog.tsx

lib/
  google/
    auth.ts                         ← documents.readonly 스코프 추가
    docs.ts                         ← 신규: Google Docs 읽기
    gemini.ts                       ← 신규: Gemini AI 요약
  hooks/
    use-materials.ts                ← SWR 훅
  types/
    database.ts                     ← Material, StudentDoc, MaterialsCache 타입 추가

supabase/
  migrations/
    007_materials.sql               ← 3개 테이블 생성 + RLS 정책

e2e/
  materials.spec.ts                 ← E2E 테스트
```

---

## Key Design Decisions

- **기존 Google OAuth 확장**: 새 OAuth 앱 없이 기존 클라이언트에 `documents.readonly` 스코프 추가
- **Gemini API 서버 사이드**: API 키 노출 방지를 위해 Server Action 내에서만 호출
- **24시간 캐싱**: Gemini API 호출 비용/한도 절약. 수동 새로고침으로 강제 갱신 가능
- **회차 파싱 전략**: '1회차', '2회차' 텍스트 기준 정규식 분리. 마킹 없으면 전체 요약
- **ActionResult<T> 패턴**: 기존 코드베이스와 일관된 에러 처리
- **Supabase Storage**: `materials` 버킷, 공개 URL 생성으로 링크 복사 기능 지원
