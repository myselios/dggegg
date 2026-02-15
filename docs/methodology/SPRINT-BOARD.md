# Sprint Board - Rocket Tutor OS

> 이 파일은 프로젝트의 영구 상태를 추적합니다.
> 새 세션 시작 시 반드시 이 파일을 읽어 현재 상태를 파악하세요.
> 스프린트 완료/시작 시 이 파일을 업데이트하세요.

---

## 현재 상태

- **현재 브랜치**: feature/mvp-0
- **마지막 커밋**: Sprint 2 완료 커밋 (아래 참조)
- **마지막 빌드**: ✅ 통과 (2026-02-14)
- **마지막 린트**: ✅ 통과 (2026-02-14)

---

## 완료된 스프린트

### Sprint 0: MVP-0 기반 구현 ✅
- **기간**: 2026-02-14
- **커밋**: ded3f31 → 4e22e41 → 3b84e5b → 836e1fb
- **완료 항목**:
  - [x] shadcn/ui + 의존성 설치 (Task 1)
  - [x] Supabase 연동 + 환경변수 (Task 2)
  - [x] DB 스키마 + 마이그레이션 (Task 3)
  - [x] 패스워드 게이트 인증 (Task 4)
  - [x] 앱 레이아웃 + 네비게이션 (Task 5)
  - [x] 학생 CRUD + SWR 훅 (Task 6)
  - [x] 학생 카드 보드 Kanban (Task 7)
  - [x] 학생 상세 페이지 (Task 8)
  - [x] 스케줄 CRUD + SWR 훅 (Task 9)
  - [x] 3주 슬라이딩 캘린더 (Task 10)
  - [x] 수업 기록 슬라이드 패널 (Task 11)
  - [x] 상담 로그 CRUD (Task 12)
  - [x] 학생 상세 탭 채우기 (Task 13)
  - [x] Dashboard 구현 (Task 14)
  - [x] 최종 검증 + 정리 (Task 15)
  - [x] UI/UX 세련화 (로그인/사이드바/헤더/대시보드/학생)

---

## 현재 스프린트

### Sprint 3: 스케줄 UX 개선 (10분 단위 정밀도 + 컴팩트 모드)
- **상태**: 🔄 In Progress
- **시작일**: 2026-02-15
- **목표**: 비정시 수업 등록/DnD 지원, 취소 보강 UX, 컴팩트 뷰, 미니캘린더 요약

#### Frontend (frontend-dev)
| # | 태스크 | 우선순위 | 상태 | blockedBy |
|---|--------|---------|------|-----------|
| S3-1 | 10분 단위 시간 선택기 (EventCreateDialog) | P0 | ✅ 완료 | 없음 |
| S3-2 | DnD 30분 droppable 분할 | P0 | ✅ 완료 | S3-1 |
| S3-3 | 취소 이벤트 "보강 추가" UX | P1 | ✅ 완료 | S3-1 |
| S3-4 | 컴팩트/확대 모드 토글 (기본=컴팩트) | P2 | ✅ 완료 | S3-2 |
| S3-5 | 미니캘린더 수업 요약 | P2 | ✅ 완료 | 없음 |

#### Phase 구현 순서
- Phase A (병렬): S3-1 + S3-5
- Phase B (순차): S3-2
- Phase C (병렬): S3-3 + S3-4

---

### Sprint 2: 완성도 향상 (차트, 미니캘린더, 충돌감지, 에러통합) ✅
- **상태**: ✅ Completed
- **시작일**: 2026-02-14
- **목표**: P2 백로그 전체 + 남은 이슈(I5~I7) 해결

#### Frontend (frontend-dev)
| # | 태스크 | 상태 |
|---|--------|------|
| S2-F1 | 성적 추이 차트 (Recharts 라인차트) [B8] | ✅ 완료 |
| S2-F2 | Dashboard 미니 캘린더 [B9] | ✅ 완료 |
| S2-F3 | 캘린더 충돌 감지 (시간 겹침 경고) [B10] | ✅ 완료 |

#### Backend (backend-dev)
| # | 태스크 | 상태 |
|---|--------|------|
| S2-B1 | 에러 핸들링 통합 ActionResult 패턴 [B11] | ✅ 완료 |
| S2-B2 | 비밀번호 비교 timing-safe 수정 [I5] | ✅ 완료 |
| S2-B3 | SWR 글로벌 설정 추가 [I6] | ✅ 완료 |
| S2-B4 | 환경변수 시작 시 검증 [I7] | ✅ 완료 |

---

### Sprint 1: MVP-0 DoD 충족 + 보안 강화
- **상태**: ✅ Completed
- **시작일**: 2026-02-14
- **목표**: MVP-0 Definition of Done 5개 항목 모두 충족 + 보안 이슈 해결

#### Frontend (frontend-dev)
| # | 태스크 | 상태 |
|---|--------|------|
| S1-F1 | 캘린더 드래그앤드롭 (시간/날짜 변경) [B1] | ✅ 완료 |
| S1-F2 | 학생 Kanban 드래그앤드롭 (상태 변경) [B2] | ✅ 완료 |
| S1-F3 | 학생 검색 (이름 한/영) [B3] | ✅ 완료 |
| S1-F4 | 학생 필터 (학교/과정/상태) [B4] | ✅ 완료 |

#### Backend (backend-dev)
| # | 태스크 | 상태 |
|---|--------|------|
| S1-B1 | lesson_notes.event_id UNIQUE 제약 추가 [I2] | ✅ 완료 |
| S1-B2 | RLS 정책 추가 [B5, I1] | ✅ 완료 |
| S1-B3 | Server Action 인증 헬퍼 [B7, I4] | ✅ 완료 |
| S1-B4 | Server Action Zod 입력 검증 [B6, I3] | ✅ 완료 |

---

## 백로그 (우선순위순)

### P0 - MVP DoD 필수
| # | 기능 | 담당 | 의존관계 | 상태 |
|---|------|------|----------|------|
| B1 | 캘린더 드래그앤드롭 (시간/날짜 변경) | frontend-dev | 없음 | ✅ Sprint 1 |
| B2 | 학생 Kanban 드래그앤드롭 (상태 변경) | frontend-dev | 없음 | ✅ Sprint 1 |

### P1 - 높은 우선순위
| # | 기능 | 담당 | 의존관계 | 상태 |
|---|------|------|----------|------|
| B3 | 학생 검색 (이름 한/영) | frontend-dev | 없음 | ✅ Sprint 1 |
| B4 | 학생 필터 (학교/과정/상태) | frontend-dev | 없음 | ✅ Sprint 1 |
| B5 | RLS 정책 추가 | backend-dev | 없음 | ✅ Sprint 1 |
| B6 | Server Action 입력 검증 (Zod) | backend-dev | 없음 | ✅ Sprint 1 |
| B7 | Server Action 인증 헬퍼 | backend-dev | 없음 | ✅ Sprint 1 |

### P2 - 중간 우선순위
| # | 기능 | 담당 | 의존관계 | 상태 |
|---|------|------|----------|------|
| B8 | 성적 추이 차트 (Recharts) | frontend-dev | 없음 | ✅ Sprint 2 |
| B9 | Dashboard 미니 캘린더 | frontend-dev | 없음 | ✅ Sprint 2 |
| B10 | 캘린더 충돌 감지 | frontend-dev | B1 | ✅ Sprint 2 |
| B11 | 에러 핸들링 통합 (ActionResult) | backend-dev | B6 | ✅ Sprint 2 |

### P3 - 낮은 우선순위
| # | 기능 | 담당 | 의존관계 | 상태 |
|---|------|------|----------|------|
| B12 | 월간 뷰 전환 | frontend-dev | 없음 | ⬜ 미시작 |
| B13 | 반복 수업 일괄 수정 | frontend-dev + backend-dev | 없음 | ⬜ 미시작 |
| B14 | Enrollment 관리 UI | frontend-dev + backend-dev | 없음 | ⬜ 미시작 |

---

## 알려진 이슈

| # | 심각도 | 설명 | 발견일 |
|---|--------|------|--------|
| I1 | ~~🔴 심각~~ | ~~RLS 미적용~~ → ✅ Sprint 1에서 해결 (S1-B2) | 2026-02-14 |
| I2 | ~~🔴 심각~~ | ~~lesson_notes UNIQUE 누락~~ → ✅ Sprint 1에서 해결 (S1-B1) | 2026-02-14 |
| I3 | ~~🟠 높음~~ | ~~입력 검증 없음~~ → ✅ Sprint 1에서 해결 (S1-B4) | 2026-02-14 |
| I4 | ~~🟠 높음~~ | ~~인증 미확인~~ → ✅ Sprint 1에서 해결 (S1-B3) | 2026-02-14 |
| I5 | ~~🟡 중간~~ | ~~비밀번호 평문 비교 (timing attack)~~ → ✅ Sprint 2에서 해결 (S2-B2) | 2026-02-14 |
| I6 | ~~🟡 중간~~ | ~~SWR 글로벌 설정 없음~~ → ✅ Sprint 2에서 해결 (S2-B3) | 2026-02-14 |
| I7 | ~~🟡 중간~~ | ~~환경변수 non-null assertion~~ → ✅ Sprint 2에서 해결 (S2-B4) | 2026-02-14 |

---

## 세션 핸드오프 노트

> 새 세션에서 이 프로젝트를 이어받을 때 아래를 확인하세요:

1. **현재 브랜치 확인**: `git branch --show-current`
2. **마지막 커밋 확인**: `git log --oneline -5`
3. **빌드 상태 확인**: `npm run build`
4. **이 파일의 "현재 스프린트" 섹션 읽기**
5. **백로그에서 다음 작업 선택**
