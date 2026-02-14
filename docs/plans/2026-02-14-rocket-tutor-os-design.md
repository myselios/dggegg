# Rocket Tutor OS - Design Document

버전: v0.2
작성일: 2026-02-14
상태: Approved

---

## 1. 제품 개요

IB 스페인어 전문 1인 강사를 위한 통합 운영 OS.
학생-자료-스케줄을 "한 화면에서 연결"해 운영 생산성을 높인다.

### 핵심 가치
- 엑셀/노트 분산 관리 → 웹 기반 통합 관리
- 드래그앤드롭으로 직관적 스케줄 관리
- 수업 종료 → 1클릭 기록 작성
- 학생 상태 30초 내 파악

### 사용자
- Primary: IB 스페인어 전문 1인 강사 (+ 강사 1명, 총 2명)
- Secondary: 학부모 (간접, 상담 근거), 학생 (피드백 품질)

---

## 2. 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| Framework | Next.js 16 + App Router | 이미 세팅됨 |
| UI | shadcn/ui + Tailwind CSS v4 | 캘린더/테이블/모달 풍부 |
| 캘린더 DnD | @dnd-kit | 드래그앤드롭 최적화 |
| 차트 | Recharts | 성적 추이 시각화 |
| DB | Supabase PostgreSQL | 관계형 DB + 무료 티어 |
| Storage | Supabase Storage | 자료 파일 저장 (무료 1GB) |
| Auth | 심플 패스워드 게이트 | 2명만 사용, Supabase Auth 불필요 |
| 배포 | Vercel | Next.js 공식, 무료 티어 |
| 상태관리 | React 19 use() + SWR | 서버/클라이언트 혼합 |

---

## 3. 아키텍처

```
┌─────────────────────────────────┐
│           Vercel                │
│  ┌───────────────────────────┐  │
│  │   Next.js 16 (App Router) │  │
│  │                           │  │
│  │  Pages (RSC + Client)     │  │
│  │  Server Actions           │  │
│  │  Middleware (Auth Gate)    │  │
│  └─────────┬─────────────────┘  │
└────────────┼────────────────────┘
             │
     ┌───────┴───────┐
     │   Supabase    │
     │  PostgreSQL   │
     │  + Storage    │
     └───────────────┘
```

### 접근법: Supabase Client-Direct
- Supabase JS SDK가 브라우저에서 직접 DB 접근
- 복잡한 로직(반복 수업 생성 등)만 Server Action 처리
- RLS(Row Level Security)로 데이터 보호

### 인증: 심플 패스워드 게이트
- 환경변수(`AUTH_PASSWORD`)에 비밀번호 1개 설정
- 로그인 시 비밀번호 입력 → Server Action에서 검증 → HTTP-only 쿠키 발급
- Next.js Middleware에서 쿠키 검증, 없으면 `/login`으로 리다이렉트

---

## 4. 기능 요구사항

### A. 학생 모듈

#### A1. 학생 리스트 (카드 뷰)
- 카드 기반 학생 보드
- 카드에 표시: 이름, 학교, 과정(Ab initio/SL/HL), 상태 뱃지, 다음 수업 일시
- **드래그앤드롭 Kanban**: Active / Paused / Ended 컬럼 간 카드 이동으로 상태 변경
- 필터: 학교, 과정, 상태
- 검색: 이름 (한/영)

#### A2. 학생 상세 페이지 (탭 구성)
```
[프로필] [수업기록] [성적 추이] [상담 로그] [자료]
```

**프로필 탭:**
- 필수: 이름(한/영), 학년, 학교명, IB 과정, 시험 예정일
- 선택: 목표 점수, 현재 점수, 약점 영역(체크박스), 메모
- 연락처: 학생/학부모 (저장만, 발송 기능 없음)
- 커스텀 필드: 강사가 자유 추가 가능

**수업기록 탭:**
- 타임라인 형태 (최근순)
- 각 기록: 날짜, 수업 내용, 숙제, 다음 목표
- 연결된 자료/성적 표시

**성적 추이 탭:**
- 라인 차트 (날짜 x축, 점수 y축)
- 평가 유형별 필터 (IO mock/Writing/Listening 등)
- 점수 기록 리스트 (날짜, 유형, 점수, 코멘트)

**상담 로그 탭:**
- 유형: 상담 / 컴플레인 / 요청 / 공지
- 필드: 날짜, 내용, 태그
- 검색: 키워드/태그/기간
- 최근 상담 상단 노출

**자료 탭:**
- 이 학생의 수업에 사용된 자료 자동 수집
- 학교 기반 기본 필터

#### A3. 등록 기록 (Enrollment)
- 학생별 다수 등록 레코드 (재등록 대비)
- 필드: 시작일, 종료(예정)일, 주당 횟수, 수업 형태, 메모
- 상태: Active / Paused / Ended

---

### B. 스케줄 모듈

#### B1. 3주 슬라이딩 캘린더 (기본 뷰)
- **기본 화면: 지난주 + 이번주 + 다음주 (총 3주)**
  - 오늘이 2/10(월)이면: 2/3~2/23 표시
  - 다음 주 월요일(2/17)이 되면: 2/10~3/2 표시
  - 슬라이딩 기준: 매주 월요일 자동 이동
- 시간축 세로 (08:00~22:00), 요일 가로 (월~일 x 3주)
- 오늘 컬럼 강조 표시
- 좌우 화살표로 수동 주 이동 가능
- 추가 뷰 전환: 월간 뷰 (한눈에 수업 밀도 파악)

#### B2. 드래그앤드롭
- 수업 이벤트를 다른 시간대로 드래그 → 시간 변경
- 이벤트 하단 리사이즈 → 수업 시간(duration) 조절
- 다른 날짜로 드래그 → 날짜 변경
- **색상 코딩**: 과정별 자동 색상 (Ab initio=초록, SL=파랑, HL=보라)
- **충돌 감지**: 같은 시간 겹침 시 시각적 경고

#### B3. 반복 수업
- 매주 같은 요일/시간 반복 생성
- 개별 이벤트 수정 시 "이후 이벤트도 변경?" 확인
- 종료일 또는 횟수로 제한

#### B4. 수업 기록 작성 (1클릭 플로우)
```
캘린더 이벤트 클릭 → 슬라이드 패널 열림 → 기록 작성 → 완료
```
- 템플릿 드롭다운: IO / Writing / Reading / Listening / Speaking
- 이전 수업 메모 1줄 미리보기 (컨텍스트 유지)
- 필드: 오늘 한 것, 숙제, 다음 목표
- (선택) 성적 기록 인라인 추가
- (선택) 사용 자료 첨부
- "완료" 시 이벤트 상태 → Completed, 학생 상세에 자동 반영

#### B5. 수업 이벤트 상태
- Scheduled (예정)
- Completed (완료, 기록 작성됨)
- Cancelled (취소)
- No-show (무단 결석)

---

### C. 자료 모듈 (MVP-1)

#### C1. 자료 저장/분류
- 1차 분류: 학교별 (Dulwich / SIS / Chadwick / UWCSEA 등)
- 2차 분류: 태그 다중 선택
  - 영역: Reading / Writing / Listening / IO
  - 유형: 기출 / 모의 / 템플릿 / 숙제 / 리뷰
- 업로드: PDF/DOCX/PPTX/이미지 → Supabase Storage
- 메타데이터: 제목, 설명, 태그, 업로드일, 최근 사용일

#### C2. 검색/필터
- 학교 선택 + 키워드 검색
- 태그 필터 (다중 선택)
- 정렬: 최근 업로드 / 최근 사용 / 제목

#### C3. 수업과 연결
- 수업 이벤트에 자료 여러 개 연결 가능
- 학생 상세 → 자료 탭에서 해당 학교 자료 기본 필터

---

### D. Dashboard

- **오늘 수업 리스트**: 시간순, 클릭 시 기록 패널
- **3주 캘린더 미니뷰**: 현재 스케줄 스냅샷
- **최근 상담 로그**: 최근 5건
- **미완료 수업 알림**: Scheduled인데 기록 미작성 이벤트 표시

---

## 5. 화면 구성 (IA)

```
/login          → 패스워드 입력
/               → Dashboard
/students       → 학생 카드 보드 (Kanban)
/students/[id]  → 학생 상세 (탭)
/schedule       → 3주 캘린더 (기본)
/materials      → 자료 리스트 + 검색 (MVP-1)
```

---

## 6. DB 스키마

```sql
-- 학생
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT NOT NULL,
  name_en TEXT,
  grade TEXT,
  school TEXT NOT NULL,
  ib_course TEXT CHECK (ib_course IN ('Ab initio', 'SL', 'HL')),
  exam_date DATE,
  target_score SMALLINT,
  current_score SMALLINT,
  weakness_areas TEXT[],
  contact_student TEXT,
  contact_parent TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  color TEXT,
  custom_fields JSONB DEFAULT '{}',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 등록 기록
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  sessions_per_week SMALLINT,
  lesson_type TEXT DEFAULT '1:1',
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 스케줄 이벤트 (허브)
CREATE TABLE schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  template_type TEXT,
  recurrence_rule TEXT,
  recurrence_group_id UUID,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 수업 기록
CREATE TABLE lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  content TEXT,
  homework TEXT,
  next_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 성적 기록
CREATE TABLE score_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL,
  score NUMERIC(5,2),
  max_score NUMERIC(5,2) DEFAULT 7,
  comment TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 상담 로그
CREATE TABLE consultation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('consultation', 'complaint', 'request', 'notice')),
  content TEXT NOT NULL,
  tags TEXT[],
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 자료 (MVP-1)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  school_tag TEXT NOT NULL,
  tags TEXT[],
  file_url TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- 수업-자료 연결 (MVP-1)
CREATE TABLE event_materials (
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, material_id)
);

-- 인덱스
CREATE INDEX idx_events_student ON schedule_events(student_id);
CREATE INDEX idx_events_start ON schedule_events(start_at);
CREATE INDEX idx_events_status ON schedule_events(status);
CREATE INDEX idx_lesson_notes_event ON lesson_notes(event_id);
CREATE INDEX idx_scores_student ON score_records(student_id);
CREATE INDEX idx_consult_student ON consultation_logs(student_id);
CREATE INDEX idx_materials_school ON materials(school_tag);
```

---

## 7. MVP 단계

### MVP-0: 기반 + 학생 + 스케줄 (핵심 흐름)

| Phase | 작업 | 설명 | 상태 |
|-------|------|------|------|
| 0-1 | 프로젝트 기반 세팅 | Supabase 연동, shadcn/ui, 패스워드 게이트, 레이아웃 | ✅ 완료 |
| 0-2 | DB 스키마 | Supabase 마이그레이션, 타입 생성 | ✅ 완료 |
| 0-3 | 학생 모듈 | 카드 보드 + 상세 페이지 + CRUD | ✅ 기본 완료 (DnD 미구현) |
| 0-4 | 스케줄 모듈 | 3주 캘린더 + 드래그앤드롭 + 반복 수업 | ⚠️ 부분 완료 (DnD 미구현) |
| 0-5 | 수업 기록 | 슬라이드 패널 + 템플릿 + 성적 연결 | ✅ 완료 |
| 0-6 | 상담 로그 | CRUD + 검색 + 태그 | ✅ 완료 |
| 0-7 | Dashboard | 오늘 수업 + 미니 캘린더 + 최근 상담 | ⚠️ 부분 완료 (미니 캘린더 미구현) |

### MVP-1: 자료 관리
| Phase | 작업 |
|-------|------|
| 1-1 | 자료 업로드/분류 (Supabase Storage) |
| 1-2 | 검색/필터 |
| 1-3 | 수업-자료 연결 |

### 추후 확장 (Out-of-scope)
- AI 음성 스케줄링
- 엑셀 임포트/익스포트
- 성적 추이 차트
- 학부모 공유 링크 (읽기 전용)
- 모바일 최적화 (PWA)
- 결제/청구/알림 자동화

---

## 8. 에이전트 활용 계획

| 에이전트 | 활용 시점 | 목적 |
|----------|----------|------|
| `architect` | Phase 0-1, 0-2 | Supabase 연동 구조, DB 스키마 검토 |
| `planner` | 각 Phase 시작 전 | 세부 구현 계획 수립 |
| `tdd-guide` | Phase 0-3, 0-4 | 핵심 로직 테스트 우선 개발 |
| `code-reviewer` | 각 Phase 완료 후 | 코드 품질/보안 리뷰 |
| `security-reviewer` | Phase 0-1 (Auth) | 패스워드 게이트 보안 검증 |

---

## 9. Out-of-scope (명시적 제외)

- 결제/청구/환불/세금
- 자동 알림 (카카오톡/문자/이메일)
- 화상수업 링크 생성
- 학생용 과제앱/자동채점
- 다강사/지점 확장
- AI 코칭/채점 자동화
- AI 음성 스케줄링 (추후 추가)
- 엑셀 임포트/익스포트 (추후 추가)

---

## 10. 경쟁사 대비 차별화

| 기능 | Teachworks | TutorBird | Rocket Tutor OS |
|------|-----------|-----------|----------------|
| IB 전문 필드 | X | X | **O** |
| 3주 슬라이딩 캘린더 | X | X | **O** |
| 드래그앤드롭 캘린더 | O | O | **O** |
| 학교별 자료 분류 | X | X | **O** |
| 학생 Kanban 보드 | X | X | **O** |
| 한국어 네이티브 | X | X | **O** |
| 1인 강사 최적화 | X | O | **O** |
| 비용 | $16+/월 | $15/월 | **무료** (Vercel+Supabase) |

---

## 11. 성공 기준 (MVP-0 Definition of Done)

1. 학생 1명 등록 → 스케줄 생성 → 수업 기록 작성 → 성적 기록 → 상담 기록
   이 전체 흐름이 **끊김 없이** 작동
2. 3주 캘린더에서 드래그앤드롭으로 수업 시간 변경 가능
3. 수업 이벤트 클릭 → 1클릭 기록 작성 → 3분 이내 완료
4. 학생 상세에서 최근 수업/성적/상담을 30초 내 파악 가능
5. 상담 로그 키워드 검색 즉시 조회 가능
