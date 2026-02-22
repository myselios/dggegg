# Google Calendar 동기화 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 수업 생성/수정/삭제 시 Google Calendar에 자동 동기화

**Architecture:** Server Action에서 수업 CRUD 후 Google Calendar API를 호출하여 동기화. OAuth 2.0으로 개인 Gmail 인증, Refresh Token을 Supabase에 저장하여 자동 갱신. Calendar API 실패 시에도 수업 자체는 정상 처리 (Calendar은 부가 기능).

**Tech Stack:** Next.js 16 App Router, googleapis npm, Supabase PostgreSQL, OAuth 2.0, Zod

---

## 사전 준비 (수동)

Google Cloud Console에서 아래 설정 필요 (코드 작업 전):
1. 프로젝트 생성
2. Google Calendar API 활성화
3. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션 타입)
4. 승인된 리다이렉트 URI 추가: `http://localhost:3000/api/auth/google/callback` + 프로덕션 URL
5. `.env.local`에 추가:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

### Task 1: googleapis 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: 패키지 설치**

```bash
npm install googleapis
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "[chore] googleapis 패키지 추가

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: DB 마이그레이션 — google_calendar_event_id 컬럼 + oauth_tokens 테이블

**Files:**
- Create: `supabase/migrations/006_google_calendar_sync.sql`

**Step 1: 마이그레이션 파일 작성**

```sql
-- Google Calendar 동기화를 위한 컬럼 추가
ALTER TABLE schedule_events
  ADD COLUMN google_calendar_event_id TEXT;

-- OAuth 토큰 저장 테이블
CREATE TABLE oauth_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   TEXT NOT NULL DEFAULT 'google',
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type    TEXT DEFAULT 'Bearer',
  expires_at    TIMESTAMPTZ NOT NULL,
  scope         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider)
);

-- RLS 정책 (1인 사용자이므로 인증된 사용자만 접근)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage oauth tokens"
  ON oauth_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

**Step 2: Supabase에 마이그레이션 적용**

Supabase Dashboard > SQL Editor에서 위 SQL 실행.
또는:
```bash
# Supabase CLI 사용 시
supabase db push
```

**Step 3: 커밋**

```bash
git add supabase/migrations/006_google_calendar_sync.sql
git commit -m "[feat] Google Calendar 동기화용 DB 마이그레이션

- schedule_events에 google_calendar_event_id 컬럼 추가
- oauth_tokens 테이블 신규 생성

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: TypeScript 타입 + 환경변수 + Zod 스키마 업데이트

**Files:**
- Modify: `lib/types/database.ts`
- Modify: `lib/env.ts`
- Modify: `lib/validations/schedule.ts`

**Step 1: database.ts에 타입 추가**

`lib/types/database.ts`에서:

1. `ScheduleEvent` 타입에 `google_calendar_event_id` 추가:
```typescript
export type ScheduleEvent = {
  // ... 기존 필드들 ...
  readonly google_calendar_event_id: string | null
  // ... created_at, updated_at ...
}
```

2. `ScheduleEventInsert`에서 `google_calendar_event_id`도 제외 (event_type처럼):
```typescript
export type ScheduleEventInsert = Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at' | 'event_type' | 'google_calendar_event_id'>
```

3. `OAuthToken` 타입 추가:
```typescript
export type OAuthToken = {
  readonly id: string
  readonly provider: string
  readonly access_token: string
  readonly refresh_token: string
  readonly token_type: string | null
  readonly expires_at: string
  readonly scope: string | null
  readonly created_at: string
  readonly updated_at: string
}
```

**Step 2: lib/env.ts에 Google 환경변수 추가**

`serverEnv`에 getter 추가:
```typescript
export const serverEnv = {
  // ... 기존 ...
  get GOOGLE_CLIENT_ID() {
    return requireServerEnv('GOOGLE_CLIENT_ID')
  },
  get GOOGLE_CLIENT_SECRET() {
    return requireServerEnv('GOOGLE_CLIENT_SECRET')
  },
  get GOOGLE_REDIRECT_URI() {
    return requireServerEnv('GOOGLE_REDIRECT_URI')
  },
} as const
```

**Step 3: validations/schedule.ts에 google_calendar_event_id 추가 (optional)**

`baseScheduleEventSchema`에 추가 불필요 — insert/update에서 제외되므로 변경 없음.

**Step 4: 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 5: 커밋**

```bash
git add lib/types/database.ts lib/env.ts
git commit -m "[feat] Google Calendar 동기화용 타입 및 환경변수 추가

- ScheduleEvent에 google_calendar_event_id 필드
- OAuthToken 타입 신규
- serverEnv에 GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Google OAuth 인증 모듈

**Files:**
- Create: `lib/google/auth.ts`

**Step 1: OAuth 인증 모듈 작성**

```typescript
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'
import type { OAuthToken } from '@/lib/types/database'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    serverEnv.GOOGLE_CLIENT_ID,
    serverEnv.GOOGLE_CLIENT_SECRET,
    serverEnv.GOOGLE_REDIRECT_URI
  )
}

/** Google 로그인 URL 생성 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

/** Authorization code → 토큰 교환 후 DB 저장 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Google OAuth 토큰을 받지 못했습니다')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('oauth_tokens')
    .upsert({
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type ?? 'Bearer',
      expires_at: new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString(),
      scope: tokens.scope ?? SCOPES.join(' '),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider' })

  if (error) {
    throw new Error(`토큰 저장 실패: ${error.message}`)
  }
}

/** DB에서 토큰 조회 + 만료 시 자동 갱신 → 인증된 OAuth2Client 반환 */
export async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: token, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', 'google')
    .single()

  if (error || !token) {
    return null // 연동되지 않음
  }

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: new Date(token.expires_at).getTime(),
  })

  // 토큰 만료 확인 → 자동 갱신
  const isExpired = new Date(token.expires_at).getTime() < Date.now() + 60_000
  if (isExpired) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: credentials.access_token,
        expires_at: new Date(credentials.expiry_date ?? Date.now() + 3600_000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'google')
  }

  return oauth2Client
}

/** Google 연동 해제 */
export async function disconnectGoogle(): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('oauth_tokens')
    .delete()
    .eq('provider', 'google')
}

/** Google 연동 상태 확인 */
export async function isGoogleConnected(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('oauth_tokens')
    .select('id')
    .eq('provider', 'google')
    .single()
  return !!data
}
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 3: 커밋**

```bash
git add lib/google/auth.ts
git commit -m "[feat] Google OAuth 인증 모듈

- OAuth2 클라이언트 생성/로그인 URL/토큰 교환
- 토큰 DB 저장 및 자동 갱신
- 연동 해제/상태 확인

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Google Calendar API 래퍼

**Files:**
- Create: `lib/google/calendar.ts`

**Step 1: Calendar API 래퍼 작성**

```typescript
import { google } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

/** 수업 → Google Calendar summary 생성 */
function buildSummary(event: ScheduleEventWithStudent): string {
  if (event.students) {
    const parts = [event.students.name_ko]
    if (event.template_type) parts.push(event.template_type)
    return parts.join(' - ')
  }
  return event.title ?? '수업'
}

/** 수업 → Google Calendar 이벤트 생성 */
export async function createCalendarEvent(
  event: ScheduleEventWithStudent
): Promise<string | null> {
  const auth = await getAuthenticatedClient()
  if (!auth) return null

  try {
    const calendar = google.calendar({ version: 'v3', auth })
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: buildSummary(event),
        start: { dateTime: event.start_at, timeZone: 'Asia/Seoul' },
        end: { dateTime: event.end_at, timeZone: 'Asia/Seoul' },
        description: event.title ?? undefined,
      },
    })
    return response.data.id ?? null
  } catch (error) {
    console.error('[Google Calendar] 이벤트 생성 실패:', error)
    return null
  }
}

/** Google Calendar 이벤트 수정 */
export async function updateCalendarEvent(
  googleEventId: string,
  event: ScheduleEventWithStudent
): Promise<boolean> {
  const auth = await getAuthenticatedClient()
  if (!auth) return false

  try {
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary: buildSummary(event),
        start: { dateTime: event.start_at, timeZone: 'Asia/Seoul' },
        end: { dateTime: event.end_at, timeZone: 'Asia/Seoul' },
        description: event.title ?? undefined,
      },
    })
    return true
  } catch (error) {
    console.error('[Google Calendar] 이벤트 수정 실패:', error)
    return false
  }
}

/** Google Calendar 이벤트 삭제 */
export async function deleteCalendarEvent(
  googleEventId: string
): Promise<boolean> {
  const auth = await getAuthenticatedClient()
  if (!auth) return false

  try {
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    })
    return true
  } catch (error) {
    console.error('[Google Calendar] 이벤트 삭제 실패:', error)
    return false
  }
}
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 3: 커밋**

```bash
git add lib/google/calendar.ts
git commit -m "[feat] Google Calendar API 래퍼

- 이벤트 생성/수정/삭제
- 학생이름 + 수업유형으로 summary 생성
- API 실패 시 null/false 반환 (수업 자체는 영향 없음)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: OAuth 콜백 API Route

**Files:**
- Create: `app/api/auth/google/callback/route.ts`

**Step 1: OAuth 콜백 핸들러 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/settings?error=google_auth_denied', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=no_code', request.url)
    )
  }

  try {
    await exchangeCodeForTokens(code)
    return NextResponse.redirect(
      new URL('/settings?success=google_connected', request.url)
    )
  } catch (err) {
    console.error('[Google OAuth] 토큰 교환 실패:', err)
    return NextResponse.redirect(
      new URL('/settings?error=token_exchange_failed', request.url)
    )
  }
}
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 3: 커밋**

```bash
git add app/api/auth/google/callback/route.ts
git commit -m "[feat] Google OAuth 콜백 핸들러

- authorization code → 토큰 교환
- 성공/실패 시 /settings로 리다이렉트

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Server Actions에 Calendar 동기화 통합

**Files:**
- Modify: `app/actions/schedule.ts`

**Step 1: schedule.ts에 Calendar 동기화 추가**

import 추가:
```typescript
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google/calendar'
```

`createScheduleEvent` 함수에서 `revalidatePath('/schedule')` 직전에 추가:
```typescript
    // Google Calendar 동기화 (실패해도 수업 생성은 유지)
    const googleEventId = await createCalendarEvent(data)
    if (googleEventId) {
      await supabase
        .from('schedule_events')
        .update({ google_calendar_event_id: googleEventId })
        .eq('id', data.id)
    }
```

`updateScheduleEvent` 함수에서 `revalidatePath` 직전에 추가:
```typescript
    // Google Calendar 동기화
    if (data.google_calendar_event_id) {
      await updateCalendarEvent(data.google_calendar_event_id, data)
    }
```

`deleteScheduleEvent` 함수에서 삭제 전에 이벤트 조회 + Calendar 삭제 추가:
```typescript
    // Google Calendar에서도 삭제
    const { data: event } = await supabase
      .from('schedule_events')
      .select('google_calendar_event_id')
      .eq('id', id)
      .single()

    if (event?.google_calendar_event_id) {
      await deleteCalendarEvent(event.google_calendar_event_id)
    }

    // 기존 삭제 로직 ...
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 3: E2E 테스트 실행 (기존 테스트 깨지지 않는지 확인)**

```bash
npm run test:e2e
```

**Step 4: 커밋**

```bash
git add app/actions/schedule.ts
git commit -m "[feat] 수업 CRUD에 Google Calendar 동기화 통합

- 생성 시 Calendar 이벤트 추가 + ID 저장
- 수정 시 Calendar 이벤트 업데이트
- 삭제 시 Calendar 이벤트 삭제
- API 실패 시에도 수업 자체는 정상 처리

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Settings 페이지 (Google 연동 UI)

**Files:**
- Create: `app/(authenticated)/settings/page.tsx`
- Create: `app/actions/google.ts`

**Step 1: Google 연동 Server Actions 작성**

`app/actions/google.ts`:
```typescript
'use server'

import { requireAuth } from '@/lib/auth'
import { getAuthUrl, disconnectGoogle, isGoogleConnected } from '@/lib/google/auth'
import type { ActionResult } from '@/lib/types/action-result'

export async function getGoogleAuthUrl(): Promise<ActionResult<string>> {
  try {
    await requireAuth()
    const url = getAuthUrl()
    return { success: true, data: url }
  } catch {
    return { success: false, error: 'Google 인증 URL 생성에 실패했습니다' }
  }
}

export async function disconnectGoogleAccount(): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    await disconnectGoogle()
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Google 연동 해제에 실패했습니다' }
  }
}

export async function checkGoogleConnection(): Promise<ActionResult<boolean>> {
  try {
    await requireAuth()
    const connected = await isGoogleConnected()
    return { success: true, data: connected }
  } catch {
    return { success: false, error: '연동 상태 확인에 실패했습니다' }
  }
}
```

**Step 2: Settings 페이지 작성**

`app/(authenticated)/settings/page.tsx` — 글래스모피즘 디자인 적용, Google 연동 버튼 + 상태 표시. searchParams로 success/error 메시지 처리.

핵심 UI:
- Google Calendar 연동 카드
- 연동됨/안됨 상태 뱃지
- 연동하기 / 연동 해제 버튼
- 성공/에러 토스트 메시지

**Step 3: 사이드바에 설정 메뉴 추가**

`components/nav/sidebar.tsx`에 `/settings` 링크 추가 (Settings 아이콘).

**Step 4: 빌드 확인**

```bash
npx tsc --noEmit && npm run build
```

**Step 5: 커밋**

```bash
git add app/actions/google.ts app/(authenticated)/settings/page.tsx components/nav/sidebar.tsx
git commit -m "[feat] 설정 페이지 — Google Calendar 연동 UI

- Google 계정 연결/해제 기능
- 연동 상태 표시
- 사이드바에 설정 메뉴 추가

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: E2E 테스트 + 최종 검증

**Files:**
- Create: `e2e/google-calendar.spec.ts`

**Step 1: 설정 페이지 E2E 테스트 작성**

Google OAuth는 외부 서비스이므로 실제 연동 테스트는 불가. 대신:
- 설정 페이지 접근 가능 확인
- 연동 버튼 렌더링 확인
- 사이드바 메뉴 동작 확인

**Step 2: 전체 검증 게이트**

```bash
npx tsc --noEmit && npm run lint && npm run build && npm run test:e2e
```

**Step 3: 최종 커밋**

```bash
git add e2e/google-calendar.spec.ts
git commit -m "[test] Google Calendar 연동 E2E 테스트

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 스프린트 구성

**Sprint 5: Google Calendar 동기화**
| # | Task | 예상 |
|---|------|------|
| 1 | googleapis 패키지 설치 | 2분 |
| 2 | DB 마이그레이션 | 5분 |
| 3 | 타입 + 환경변수 + 스키마 | 5분 |
| 4 | Google OAuth 인증 모듈 | 10분 |
| 5 | Google Calendar API 래퍼 | 10분 |
| 6 | OAuth 콜백 API Route | 5분 |
| 7 | Server Actions 동기화 통합 | 10분 |
| 8 | Settings 페이지 UI | 15분 |
| 9 | E2E 테스트 + 최종 검증 | 10분 |

**의존관계:** Task 1→2→3→4→5→6→7→8→9 (순차적)
