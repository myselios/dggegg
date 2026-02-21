# Sprint Board - Rocket Tutor OS

> 이 파일은 프로젝트의 영구 상태를 추적합니다.
> 새 세션 시작 시 반드시 이 파일을 읽어 현재 상태를 파악하세요.
> 스프린트 완료/시작 시 이 파일을 업데이트하세요.

---

## 현재 상태

- **현재 브랜치**: main
- **마지막 커밋**: 5aa115d ([fix] 이벤트 제목을 여러 줄로 표시)
- **마지막 빌드**: ✅ 통과 (2026-02-21)
- **마지막 E2E**: ✅ 16 passed, 0 failed (2026-02-21)
- **DB 마이그레이션**: 005 적용 완료 (student_id nullable, title, event_type 추가)

---

## 완료된 추가 작업 (Sprint 3 이후)

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
| 34d2a95 | chore | .gitignore 업데이트 |
| 5ff7268 | fix | 수업 클릭 이벤트 복구 - 드래그와 클릭 충돌 해결 |
| 6472dc8 | fix | 클릭-드래그 영역 분리 + 서버 업데이트 수정 |
| 21f28c3 | fix | 스케줄 셀 클릭 시 분 기본값 0분 |
| 30b73cb | fix | 메모 이벤트 표시 및 클릭 수정 |
| b6e2519 | fix | 버그 3건 수정 (터치드래그/메모삭제/overflow) + 검증 게이트 방법론 + E2E 안정화 |
| edcb73c | fix | 터치 드래그 inline style 방식 + overflow 재수정 |
| 06892ad | style | 이벤트 블록에서 시간 표시 제거 - 제목/메모만 표시 |
| ef7bce7 | feat | 이벤트 블록 높이를 수업 시간에 비례하도록 변경 |
| 5aa115d | fix | 이벤트 제목을 여러 줄로 표시 (line-clamp-3) |

---

## 완료된 스프린트 상세

### Sprint 3: 스케줄 UX 개선 (10분 단위 정밀도 + 컴팩트 모드) ✅
- **상태**: ✅ Completed
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
| I8 | ~~🟠 높음~~ | ~~갤럭시탭 터치 드래그 작동 안 됨~~ → ✅ inline style touchAction 수정 (edcb73c) | 2026-02-21 |
| I9 | ~~🟠 높음~~ | ~~메모 이벤트 삭제 불가~~ → ✅ MemoEditDialog 추가 (b6e2519) | 2026-02-21 |
| I10 | ~~🟡 중간~~ | ~~긴 메모 제목이 옆 날짜 칸으로 침범~~ → ✅ overflow-hidden + line-clamp (edcb73c, 5aa115d) | 2026-02-21 |

---

## 세션 핸드오프 노트

> 새 세션에서 이 프로젝트를 이어받을 때 아래를 확인하세요:

1. **현재 브랜치 확인**: `git branch --show-current`
2. **마지막 커밋 확인**: `git log --oneline -5`
3. **빌드 상태 확인**: `npm run build`
4. **E2E 테스트 확인**: `npm run test:e2e`
5. **이 파일의 "현재 스프린트" 섹션 읽기**
6. **백로그에서 다음 작업 선택**

### 2026-02-21 세션 노트

**완료한 작업:**
- 스케줄 셀 클릭 시 분 기본값 0분 수정
- DB 마이그레이션 005 적용 (메모 기능 지원)
- 메모 이벤트 표시/클릭/삭제 기능 구현 (MemoEditDialog)
- 갤럭시탭 터치 드래그 수정 (inline style touchAction)
- 제목 overflow 수정 (overflow-hidden + line-clamp-3)
- 이벤트 블록 시간 표시 제거 (이름/메모만 표시)
- 이벤트 블록 높이를 수업 시간에 비례하도록 변경
- Push 전 필수 검증 게이트 방법론 정의 (tsc → lint → build → e2e)
- E2E 테스트 안정화 + 메모 테스트 추가

**주의사항:**
- E2E 테스트가 실제 프로덕션 DB에 데이터 생성함 → 테스트 데이터 격리 필요
- `schedule-dnd.spec.ts` 3건은 수업 이벤트가 없으면 skip됨
- main 브랜치 직접 push 중 → 브랜치 전략 재정비 필요

**다음 할 일 후보:**
- E2E 테스트 데이터 격리 (테스트 DB 또는 cleanup)
- 백로그: B12 월간 뷰, B13 반복 수업 일괄 수정, B14 Enrollment 관리 UI
- CSV 학생 임포트 기능 (설계 완료: `docs/plans/2026-02-21-csv-student-import-design.md`)
