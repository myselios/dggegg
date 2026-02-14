# Rocket Tutor OS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** IB 1인 강사용 통합 운영 OS MVP-0 (학생 관리 + 3주 캘린더 + 수업 기록 + 상담 로그 + 대시보드)

**Architecture:** Next.js 16 App Router + Supabase (PostgreSQL + Storage) + shadcn/ui. 심플 패스워드 게이트 인증. Supabase Client SDK로 브라우저 직접 DB 접근, 복잡 로직만 Server Action 처리.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui, @dnd-kit, Supabase, SWR, Recharts, Vercel

**Design Doc:** `docs/plans/2026-02-14-rocket-tutor-os-design.md`

---

## Task 1: shadcn/ui 초기화 + 핵심 의존성 설치 ✅

**Files:**
- Modify: `package.json`
- Create: `components.json`
- Create: `lib/utils.ts`

**Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init -d
```
- Style: New York
- Base color: Neutral
- CSS variables: yes

**Step 2: 핵심 의존성 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr swr @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts date-fns
```

**Step 3: 필수 shadcn/ui 컴포넌트 설치**

```bash
npx shadcn@latest add button card input label dialog sheet tabs badge select textarea separator avatar dropdown-menu calendar popover command toast
```

**Step 4: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공

**Step 5: Commit**

```bash
git add -A
git commit -m "[chore] shadcn/ui 초기화 및 핵심 의존성 설치"
```

---

## Task 2: Supabase 연동 + 환경변수 설정 ✅

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local.example`
- Modify: `.gitignore`

**Step 1: .env.local.example 생성**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
AUTH_PASSWORD=your-secure-password
AUTH_SECRET=your-jwt-secret-min-32-chars
```

**Step 2: .gitignore에 .env.local 확인**

`.gitignore`에 `.env.local`이 이미 포함되어 있는지 확인. 없으면 추가.

**Step 3: Supabase 브라우저 클라이언트 생성**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4: Supabase 서버 클라이언트 생성**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    }
  )
}
```

**Step 5: Commit**

```bash
git add lib/supabase/ .env.local.example .gitignore
git commit -m "[chore] Supabase 클라이언트 설정 및 환경변수 템플릿"
```

---

## Task 3: DB 스키마 + Supabase 마이그레이션 ✅

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `lib/types/database.ts`

**Step 1: SQL 마이그레이션 파일 작성**

`supabase/migrations/001_initial_schema.sql` 에 설계 문서의 전체 스키마 작성:
- students, enrollments, schedule_events, lesson_notes, score_records, consultation_logs 테이블
- materials, event_materials 테이블 (MVP-1이지만 스키마는 미리 생성)
- 인덱스

```sql
-- students
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

-- enrollments
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

-- schedule_events (허브)
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

-- lesson_notes
CREATE TABLE lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  content TEXT,
  homework TEXT,
  next_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- score_records
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

-- consultation_logs
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

-- materials (MVP-1)
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

-- event_materials (MVP-1)
CREATE TABLE event_materials (
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, material_id)
);

-- Indexes
CREATE INDEX idx_events_student ON schedule_events(student_id);
CREATE INDEX idx_events_start ON schedule_events(start_at);
CREATE INDEX idx_events_status ON schedule_events(status);
CREATE INDEX idx_lesson_notes_event ON lesson_notes(event_id);
CREATE INDEX idx_scores_student ON score_records(student_id);
CREATE INDEX idx_consult_student ON consultation_logs(student_id);
CREATE INDEX idx_materials_school ON materials(school_tag);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Step 2: TypeScript 타입 정의**

```typescript
// lib/types/database.ts
export type Student = {
  readonly id: string
  readonly name_ko: string
  readonly name_en: string | null
  readonly grade: string | null
  readonly school: string
  readonly ib_course: 'Ab initio' | 'SL' | 'HL' | null
  readonly exam_date: string | null
  readonly target_score: number | null
  readonly current_score: number | null
  readonly weakness_areas: string[] | null
  readonly contact_student: string | null
  readonly contact_parent: string | null
  readonly status: 'active' | 'paused' | 'ended'
  readonly color: string | null
  readonly custom_fields: Record<string, unknown>
  readonly memo: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type StudentInsert = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'status' | 'custom_fields'> & {
  readonly status?: Student['status']
  readonly custom_fields?: Record<string, unknown>
}

export type StudentUpdate = Partial<StudentInsert>

export type Enrollment = {
  readonly id: string
  readonly student_id: string
  readonly start_date: string
  readonly end_date: string | null
  readonly sessions_per_week: number | null
  readonly lesson_type: string
  readonly notes: string | null
  readonly status: 'active' | 'paused' | 'ended'
  readonly created_at: string
}

export type EnrollmentInsert = Omit<Enrollment, 'id' | 'created_at'>

export type ScheduleEvent = {
  readonly id: string
  readonly student_id: string
  readonly start_at: string
  readonly end_at: string
  readonly status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  readonly template_type: string | null
  readonly recurrence_rule: string | null
  readonly recurrence_group_id: string | null
  readonly color: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type ScheduleEventInsert = Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at'>

export type ScheduleEventUpdate = Partial<ScheduleEventInsert>

export type LessonNote = {
  readonly id: string
  readonly event_id: string
  readonly student_id: string
  readonly content: string | null
  readonly homework: string | null
  readonly next_goal: string | null
  readonly created_at: string
}

export type LessonNoteInsert = Omit<LessonNote, 'id' | 'created_at'>

export type ScoreRecord = {
  readonly id: string
  readonly student_id: string
  readonly event_id: string | null
  readonly assessment_type: string
  readonly score: number | null
  readonly max_score: number
  readonly comment: string | null
  readonly date: string
  readonly created_at: string
}

export type ScoreRecordInsert = Omit<ScoreRecord, 'id' | 'created_at'>

export type ConsultationLog = {
  readonly id: string
  readonly student_id: string
  readonly event_id: string | null
  readonly type: 'consultation' | 'complaint' | 'request' | 'notice'
  readonly content: string
  readonly tags: string[] | null
  readonly date: string
  readonly created_at: string
}

export type ConsultationLogInsert = Omit<ConsultationLog, 'id' | 'created_at'>

// 조인 타입
export type ScheduleEventWithStudent = ScheduleEvent & {
  readonly students: Pick<Student, 'id' | 'name_ko' | 'name_en' | 'school' | 'ib_course'>
}

export type LessonNoteWithEvent = LessonNote & {
  readonly schedule_events: Pick<ScheduleEvent, 'id' | 'start_at' | 'template_type'>
}
```

**Step 3: Supabase에 SQL 실행**

Supabase Dashboard > SQL Editor에서 마이그레이션 SQL 실행.
또는 Supabase CLI 사용:

```bash
npx supabase db push
```

**Step 4: Commit**

```bash
git add supabase/ lib/types/
git commit -m "[chore] DB 스키마 마이그레이션 및 TypeScript 타입 정의"
```

---

## Task 4: 패스워드 게이트 인증 ✅

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/actions/auth.ts`
- Create: `middleware.ts`

**Step 1: 로그인 Server Action 작성**

```typescript
// app/actions/auth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const password = formData.get('password') as string

  if (password !== process.env.AUTH_PASSWORD) {
    return { error: '비밀번호가 올바르지 않습니다' }
  }

  const cookieStore = await cookies()
  cookieStore.set('auth-token', process.env.AUTH_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: '/',
  })

  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  redirect('/login')
}
```

**Step 2: Middleware 작성**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!token || token !== process.env.AUTH_SECRET) {
    if (isLoginPage) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Step 3: 로그인 페이지 작성**

```tsx
// app/login/page.tsx
'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Rocket Tutor OS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 4: 빌드 확인**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add app/login/ app/actions/auth.ts middleware.ts
git commit -m "[feat] 심플 패스워드 게이트 인증 구현"
```

---

## Task 5: 앱 레이아웃 + 네비게이션 ✅

**Files:**
- Create: `app/(authenticated)/layout.tsx`
- Create: `components/nav/sidebar.tsx`
- Create: `components/nav/header.tsx`
- Move: `app/page.tsx` → `app/(authenticated)/page.tsx`
- Modify: `app/layout.tsx`

**Step 1: 루트 레이아웃 수정**

`app/layout.tsx`에서 메타데이터를 Rocket Tutor OS로 변경.

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Rocket Tutor OS",
  description: "IB 전문 1인 강사 통합 운영 시스템",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
```

**Step 2: Sidebar 컴포넌트 작성**

```tsx
// components/nav/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/students', label: '학생 관리', icon: 'Users' },
  { href: '/schedule', label: '스케줄', icon: 'Calendar' },
  { href: '/materials', label: '자료 관리', icon: 'FolderOpen' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Rocket Tutor</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

**Step 3: Header 컴포넌트 작성**

```tsx
// components/nav/header.tsx
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />
      <form action={logout}>
        <Button variant="ghost" size="sm" type="submit">
          로그아웃
        </Button>
      </form>
    </header>
  )
}
```

**Step 4: 인증 레이아웃 생성**

```tsx
// app/(authenticated)/layout.tsx
import { Sidebar } from '@/components/nav/sidebar'
import { Header } from '@/components/nav/header'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Step 5: Dashboard placeholder 페이지**

```tsx
// app/(authenticated)/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="mt-2 text-muted-foreground">오늘의 수업과 최근 활동을 확인하세요.</p>
    </div>
  )
}
```

**Step 6: 학생/스케줄/자료 placeholder 페이지 생성**

```tsx
// app/(authenticated)/students/page.tsx
export default function StudentsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">학생 관리</h2>
    </div>
  )
}
```

```tsx
// app/(authenticated)/schedule/page.tsx
export default function SchedulePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">스케줄</h2>
    </div>
  )
}
```

```tsx
// app/(authenticated)/materials/page.tsx
export default function MaterialsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">자료 관리</h2>
    </div>
  )
}
```

**Step 7: 빌드 확인**

```bash
npm run build
```

**Step 8: Commit**

```bash
git add app/ components/nav/
git commit -m "[feat] 앱 레이아웃, 사이드바, 네비게이션 구성"
```

---

## Task 6: 학생 CRUD Server Actions + SWR 훅 ✅

**Files:**
- Create: `app/actions/students.ts`
- Create: `lib/hooks/use-students.ts`

**Step 1: 학생 CRUD Server Actions**

```typescript
// app/actions/students.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StudentInsert, StudentUpdate } from '@/lib/types/database'

export async function getStudents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name_ko')

  if (error) throw new Error(error.message)
  return data
}

export async function getStudent(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createStudent(input: StudentInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  return data
}

export async function updateStudent(id: string, input: StudentUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return data
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/students')
}
```

**Step 2: SWR 훅 (클라이언트 사이드 데이터 페칭)**

```typescript
// lib/hooks/use-students.ts
'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types/database'

const supabase = createClient()

async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name_ko')

  if (error) throw new Error(error.message)
  return data
}

async function fetchStudent(id: string): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export function useStudents() {
  return useSWR<Student[]>('students', fetchStudents)
}

export function useStudent(id: string) {
  return useSWR<Student>(id ? `student-${id}` : null, () => fetchStudent(id))
}
```

**Step 3: Commit**

```bash
git add app/actions/students.ts lib/hooks/
git commit -m "[feat] 학생 CRUD Server Actions 및 SWR 훅"
```

---

## Task 7: 학생 카드 보드 (Kanban 뷰) ✅

**Files:**
- Modify: `app/(authenticated)/students/page.tsx`
- Create: `components/students/student-board.tsx`
- Create: `components/students/student-card.tsx`
- Create: `components/students/student-create-dialog.tsx`

**Step 1: 학생 카드 컴포넌트**

```tsx
// components/students/student-card.tsx
'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Student } from '@/lib/types/database'

const courseColors: Record<string, string> = {
  'Ab initio': 'bg-green-100 text-green-800',
  'SL': 'bg-blue-100 text-blue-800',
  'HL': 'bg-purple-100 text-purple-800',
}

export function StudentCard({ student }: { readonly student: Student }) {
  return (
    <Link href={`/students/${student.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{student.name_ko}</span>
            {student.ib_course && (
              <Badge variant="secondary" className={courseColors[student.ib_course] ?? ''}>
                {student.ib_course}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{student.school}</span>
          {student.name_en && (
            <span className="text-xs text-muted-foreground">{student.name_en}</span>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Step 2: Kanban 보드 컴포넌트**

```tsx
// components/students/student-board.tsx
'use client'

import { useMemo } from 'react'
import { useStudents } from '@/lib/hooks/use-students'
import { StudentCard } from './student-card'
import { StudentCreateDialog } from './student-create-dialog'
import type { Student } from '@/lib/types/database'

const columns = [
  { key: 'active', label: 'Active', color: 'border-green-400' },
  { key: 'paused', label: 'Paused', color: 'border-yellow-400' },
  { key: 'ended', label: 'Ended', color: 'border-gray-400' },
] as const

export function StudentBoard() {
  const { data: students, error, isLoading } = useStudents()

  const grouped = useMemo(() => {
    if (!students) return { active: [], paused: [], ended: [] }
    return {
      active: students.filter((s) => s.status === 'active'),
      paused: students.filter((s) => s.status === 'paused'),
      ended: students.filter((s) => s.status === 'ended'),
    }
  }, [students])

  if (isLoading) return <div className="text-muted-foreground">로딩 중...</div>
  if (error) return <div className="text-red-500">에러: {error.message}</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">학생 관리</h2>
        <StudentCreateDialog />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.key} className={`flex flex-col gap-3 rounded-lg border-t-4 ${col.color} bg-muted/30 p-4`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{col.label}</h3>
              <Badge variant="outline">{grouped[col.key].length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {grouped[col.key].map((student: Student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

이 컴포넌트에서 `Badge`를 사용하므로 import 추가 필요.

**Step 3: 학생 생성 다이얼로그**

```tsx
// components/students/student-create-dialog.tsx
'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { createStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function StudentCreateDialog() {
  const [open, setOpen] = useState(false)
  const { mutate } = useSWRConfig()

  async function handleSubmit(formData: FormData) {
    await createStudent({
      name_ko: formData.get('name_ko') as string,
      name_en: (formData.get('name_en') as string) || null,
      grade: (formData.get('grade') as string) || null,
      school: formData.get('school') as string,
      ib_course: (formData.get('ib_course') as 'Ab initio' | 'SL' | 'HL') || null,
      exam_date: (formData.get('exam_date') as string) || null,
      target_score: null,
      current_score: null,
      weakness_areas: null,
      contact_student: (formData.get('contact_student') as string) || null,
      contact_parent: (formData.get('contact_parent') as string) || null,
      color: null,
      memo: null,
    })
    await mutate('students')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>학생 추가</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 학생 등록</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name_ko">이름 (한글) *</Label>
              <Input id="name_ko" name="name_ko" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name_en">이름 (영문)</Label>
              <Input id="name_en" name="name_en" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="school">학교 *</Label>
              <Input id="school" name="school" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade">학년</Label>
              <Input id="grade" name="grade" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ib_course">IB 과정</Label>
              <Select name="ib_course">
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ab initio">Ab initio</SelectItem>
                  <SelectItem value="SL">SL</SelectItem>
                  <SelectItem value="HL">HL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="exam_date">시험 예정일</Label>
              <Input id="exam_date" name="exam_date" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_student">학생 연락처</Label>
              <Input id="contact_student" name="contact_student" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_parent">학부모 연락처</Label>
              <Input id="contact_parent" name="contact_parent" />
            </div>
          </div>
          <Button type="submit" className="w-full">등록</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Students 페이지 연결**

```tsx
// app/(authenticated)/students/page.tsx
import { StudentBoard } from '@/components/students/student-board'

export default function StudentsPage() {
  return <StudentBoard />
}
```

**Step 5: 빌드 확인**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add app/(authenticated)/students/ components/students/
git commit -m "[feat] 학생 카드 보드 (Kanban 뷰) 및 학생 등록 다이얼로그"
```

---

## Task 8: 학생 상세 페이지 (프로필 + 탭) ✅

**Files:**
- Create: `app/(authenticated)/students/[id]/page.tsx`
- Create: `components/students/student-profile.tsx`
- Create: `components/students/student-tabs.tsx`

**Step 1: 학생 상세 페이지**

```tsx
// app/(authenticated)/students/[id]/page.tsx
import { getStudent } from '@/app/actions/students'
import { StudentTabs } from '@/components/students/student-tabs'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudent(id)

  return <StudentTabs student={student} />
}
```

**Step 2: StudentTabs 컴포넌트**

프로필/수업기록/성적/상담/자료 탭 구성. 각 탭의 내용은 후속 Task에서 채움.

```tsx
// components/students/student-tabs.tsx
'use client'

import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentProfile } from './student-profile'
import type { Student } from '@/lib/types/database'

export function StudentTabs({ student }: { readonly student: Student }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/students" className="text-muted-foreground hover:text-foreground">
          &larr; 학생 목록
        </Link>
        <h2 className="text-2xl font-bold">{student.name_ko}</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="lessons">수업기록</TabsTrigger>
          <TabsTrigger value="scores">성적 추이</TabsTrigger>
          <TabsTrigger value="consultations">상담 로그</TabsTrigger>
          <TabsTrigger value="materials">자료</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <StudentProfile student={student} />
        </TabsContent>
        <TabsContent value="lessons">
          <p className="text-muted-foreground">수업 기록이 여기에 표시됩니다.</p>
        </TabsContent>
        <TabsContent value="scores">
          <p className="text-muted-foreground">성적 추이가 여기에 표시됩니다.</p>
        </TabsContent>
        <TabsContent value="consultations">
          <p className="text-muted-foreground">상담 로그가 여기에 표시됩니다.</p>
        </TabsContent>
        <TabsContent value="materials">
          <p className="text-muted-foreground">자료가 여기에 표시됩니다.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 3: 프로필 탭 컴포넌트**

```tsx
// components/students/student-profile.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStudent, deleteStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Student } from '@/lib/types/database'

export function StudentProfile({ student }: { readonly student: Student }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  async function handleUpdate(formData: FormData) {
    await updateStudent(student.id, {
      name_ko: formData.get('name_ko') as string,
      name_en: (formData.get('name_en') as string) || null,
      grade: (formData.get('grade') as string) || null,
      school: formData.get('school') as string,
      ib_course: (formData.get('ib_course') as Student['ib_course']) || null,
      exam_date: (formData.get('exam_date') as string) || null,
      target_score: Number(formData.get('target_score')) || null,
      current_score: Number(formData.get('current_score')) || null,
      contact_student: (formData.get('contact_student') as string) || null,
      contact_parent: (formData.get('contact_parent') as string) || null,
      memo: (formData.get('memo') as string) || null,
    })
    setIsEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteStudent(student.id)
    router.push('/students')
  }

  if (!isEditing) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              기본 정보
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                수정
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="이름 (한글)" value={student.name_ko} />
            <InfoRow label="이름 (영문)" value={student.name_en} />
            <InfoRow label="학교" value={student.school} />
            <InfoRow label="학년" value={student.grade} />
            <InfoRow label="IB 과정" value={student.ib_course} />
            <InfoRow label="시험 예정일" value={student.exam_date} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>성적 / 연락처</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="목표 점수" value={student.target_score?.toString()} />
            <InfoRow label="현재 점수" value={student.current_score?.toString()} />
            <InfoRow label="학생 연락처" value={student.contact_student} />
            <InfoRow label="학부모 연락처" value={student.contact_parent} />
            {student.memo && <InfoRow label="메모" value={student.memo} />}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form action={handleUpdate}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            프로필 수정
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button size="sm" type="submit">저장</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="이름 (한글)" name="name_ko" defaultValue={student.name_ko} required />
          <Field label="이름 (영문)" name="name_en" defaultValue={student.name_en ?? ''} />
          <Field label="학교" name="school" defaultValue={student.school} required />
          <Field label="학년" name="grade" defaultValue={student.grade ?? ''} />
          <div className="flex flex-col gap-2">
            <Label>IB 과정</Label>
            <Select name="ib_course" defaultValue={student.ib_course ?? undefined}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ab initio">Ab initio</SelectItem>
                <SelectItem value="SL">SL</SelectItem>
                <SelectItem value="HL">HL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="시험 예정일" name="exam_date" type="date" defaultValue={student.exam_date ?? ''} />
          <Field label="목표 점수" name="target_score" type="number" defaultValue={student.target_score?.toString() ?? ''} />
          <Field label="현재 점수" name="current_score" type="number" defaultValue={student.current_score?.toString() ?? ''} />
          <Field label="학생 연락처" name="contact_student" defaultValue={student.contact_student ?? ''} />
          <Field label="학부모 연락처" name="contact_parent" defaultValue={student.contact_parent ?? ''} />
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>메모</Label>
            <Textarea name="memo" defaultValue={student.memo ?? ''} />
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end">
        <Button variant="destructive" size="sm" type="button" onClick={handleDelete}>
          학생 삭제
        </Button>
      </div>
    </form>
  )
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? '-'}</span>
    </div>
  )
}

function Field({
  label, name, defaultValue = '', type = 'text', required = false,
}: {
  readonly label: string
  readonly name: string
  readonly defaultValue?: string
  readonly type?: string
  readonly required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  )
}
```

**Step 4: 빌드 확인 + Commit**

```bash
npm run build
git add app/(authenticated)/students/ components/students/
git commit -m "[feat] 학생 상세 페이지 (프로필 탭 + 편집/삭제)"
```

---

## Task 9: 스케줄 CRUD Server Actions + SWR 훅 ✅

**Files:**
- Create: `app/actions/schedule.ts`
- Create: `lib/hooks/use-schedule.ts`
- Create: `lib/utils/date.ts`

**Step 1: 날짜 유틸리티**

```typescript
// lib/utils/date.ts
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 3주 슬라이딩 윈도우의 시작/종료 날짜 계산
 * 지난주 월요일 ~ 다음주 일요일
 */
export function getThreeWeekRange(baseDate: Date = new Date()) {
  const lastWeekStart = startOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 })
  const nextWeekEnd = endOfWeek(addWeeks(baseDate, 1), { weekStartsOn: 1 })
  return { start: lastWeekStart, end: nextWeekEnd }
}

/**
 * 주어진 범위의 모든 날짜를 주 단위로 그룹화
 */
export function getWeeksInRange(start: Date, end: Date): Date[][] {
  const weeks: Date[][] = []
  let current = startOfWeek(start, { weekStartsOn: 1 })

  while (current <= end) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(current)
      day.setDate(day.getDate() + i)
      week.push(day)
    }
    weeks.push(week)
    current = addWeeks(current, 1)
  }

  return weeks
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm')
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'M/d (EEE)', { locale: ko })
}

export function formatDateFull(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM-dd')
}
```

**Step 2: 스케줄 Server Actions**

```typescript
// app/actions/schedule.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ScheduleEventInsert, ScheduleEventUpdate } from '@/lib/types/database'

export async function getScheduleEvents(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .gte('start_at', startDate)
    .lte('start_at', endDate)
    .order('start_at')

  if (error) throw new Error(error.message)
  return data
}

export async function createScheduleEvent(input: ScheduleEventInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .insert(input)
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}

export async function updateScheduleEvent(id: string, input: ScheduleEventUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .update(input)
    .eq('id', id)
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}

export async function deleteScheduleEvent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
}

export async function createRecurringEvents(
  baseEvent: Omit<ScheduleEventInsert, 'recurrence_group_id'>,
  repeatCount: number
) {
  const groupId = crypto.randomUUID()
  const events: ScheduleEventInsert[] = []

  for (let i = 0; i < repeatCount; i++) {
    const start = new Date(baseEvent.start_at)
    const end = new Date(baseEvent.end_at)
    start.setDate(start.getDate() + i * 7)
    end.setDate(end.getDate() + i * 7)

    events.push({
      ...baseEvent,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      recurrence_group_id: groupId,
      recurrence_rule: `WEEKLY:${repeatCount}`,
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .insert(events)
    .select()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}
```

**Step 3: SWR 훅**

```typescript
// lib/hooks/use-schedule.ts
'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const supabase = createClient()

async function fetchEvents([, start, end]: [string, string, string]): Promise<ScheduleEventWithStudent[]> {
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*, students(id, name_ko, name_en, school, ib_course)')
    .gte('start_at', start)
    .lte('start_at', end)
    .order('start_at')

  if (error) throw new Error(error.message)
  return data as ScheduleEventWithStudent[]
}

export function useScheduleEvents(startDate: string, endDate: string) {
  return useSWR<ScheduleEventWithStudent[]>(
    ['schedule-events', startDate, endDate],
    fetchEvents
  )
}
```

**Step 4: Commit**

```bash
git add app/actions/schedule.ts lib/hooks/use-schedule.ts lib/utils/date.ts
git commit -m "[feat] 스케줄 CRUD Server Actions, SWR 훅, 날짜 유틸리티"
```

---

## Task 10: 3주 슬라이딩 캘린더 UI ✅

**Files:**
- Modify: `app/(authenticated)/schedule/page.tsx`
- Create: `components/schedule/three-week-calendar.tsx`
- Create: `components/schedule/calendar-event-block.tsx`
- Create: `components/schedule/event-create-dialog.tsx`

**Step 1: 캘린더 이벤트 블록 컴포넌트**

```tsx
// components/schedule/calendar-event-block.tsx
'use client'

import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const courseColors: Record<string, string> = {
  'Ab initio': 'bg-green-200 border-green-400 text-green-900',
  'SL': 'bg-blue-200 border-blue-400 text-blue-900',
  'HL': 'bg-purple-200 border-purple-400 text-purple-900',
}

const statusStyles: Record<string, string> = {
  completed: 'opacity-60',
  cancelled: 'opacity-40 line-through',
  no_show: 'opacity-40 bg-red-100 border-red-300',
}

export function CalendarEventBlock({
  event,
  onClick,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClick: () => void
}) {
  const course = event.students?.ib_course ?? ''
  const colorClass = courseColors[course] ?? 'bg-gray-200 border-gray-400 text-gray-900'
  const statusClass = statusStyles[event.status] ?? ''

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded border-l-4 px-2 py-1 text-left text-xs transition-shadow hover:shadow-md',
        colorClass,
        statusClass
      )}
    >
      <div className="font-semibold truncate">{event.students?.name_ko}</div>
      <div className="text-[10px] opacity-75">
        {formatTime(event.start_at)} - {formatTime(event.end_at)}
      </div>
      {event.template_type && (
        <div className="text-[10px] opacity-60">{event.template_type}</div>
      )}
    </button>
  )
}
```

**Step 2: 3주 슬라이딩 캘린더**

```tsx
// components/schedule/three-week-calendar.tsx
'use client'

import { useState, useMemo } from 'react'
import { addWeeks, subWeeks, isSameDay, isToday, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getWeeksInRange, formatDateFull } from '@/lib/utils/date'
import { CalendarEventBlock } from './calendar-event-block'
import { EventCreateDialog } from './event-create-dialog'
import { Button } from '@/components/ui/button'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 ~ 22:00

export function ThreeWeekCalendar() {
  const [baseDate, setBaseDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)

  const { start, end } = useMemo(() => getThreeWeekRange(baseDate), [baseDate])
  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])
  const allDays = useMemo(() => weeks.flat(), [weeks])

  const { data: events, mutate } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

  function getEventsForDayHour(day: Date, hour: number) {
    if (!events) return []
    return events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return isSameDay(eventDate, day) && eventDate.getHours() === hour
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: 네비게이션 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">스케줄</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBaseDate(subWeeks(baseDate, 1))}>
            &larr; 이전 주
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date())}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(addWeeks(baseDate, 1))}>
            다음 주 &rarr;
          </Button>
        </div>
      </div>

      {/* 주 구분 헤더 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {weeks.map((week, i) => (
          <span key={i} className="flex-1 text-center font-medium">
            {format(week[0], 'M월 d일', { locale: ko })} ~ {format(week[6], 'M월 d일', { locale: ko })}
          </span>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-[60px_repeat(21,1fr)] border-b">
            <div /> {/* 시간 열 */}
            {allDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  'border-l px-1 py-2 text-center text-xs',
                  isToday(day) && 'bg-primary/10 font-bold',
                  i % 7 === 0 && i > 0 && 'border-l-2 border-l-primary/30'
                )}
              >
                <div>{format(day, 'EEE', { locale: ko })}</div>
                <div className={cn(
                  'text-lg',
                  isToday(day) && 'rounded-full bg-primary text-primary-foreground mx-auto w-8 h-8 flex items-center justify-center'
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* 시간 그리드 */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(21,1fr)] border-b">
              <div className="flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground">
                {`${hour}:00`}
              </div>
              {allDays.map((day, dayIdx) => {
                const cellEvents = getEventsForDayHour(day, hour)
                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'min-h-[48px] border-l p-0.5 cursor-pointer hover:bg-muted/50',
                      isToday(day) && 'bg-primary/5',
                      dayIdx % 7 === 0 && dayIdx > 0 && 'border-l-2 border-l-primary/30'
                    )}
                    onClick={() => setSelectedSlot({ date: day, hour })}
                  >
                    {cellEvents.map((event) => (
                      <CalendarEventBlock
                        key={event.id}
                        event={event}
                        onClick={() => {
                          setSelectedEvent(event)
                          setSelectedSlot(null)
                        }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 이벤트 생성 다이얼로그 */}
      {selectedSlot && (
        <EventCreateDialog
          date={selectedSlot.date}
          hour={selectedSlot.hour}
          onClose={() => setSelectedSlot(null)}
          onCreated={() => {
            setSelectedSlot(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
```

참고: 위 `cn` 함수는 `@/lib/utils`에서 이미 제공되므로 import로 대체. 위 코드는 인라인 시안용.

**Step 3: 수업 이벤트 생성 다이얼로그**

```tsx
// components/schedule/event-create-dialog.tsx
'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useStudents } from '@/lib/hooks/use-students'
import { createScheduleEvent, createRecurringEvents } from '@/app/actions/schedule'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TEMPLATE_TYPES = ['IO', 'Writing', 'Reading', 'Listening', 'Speaking'] as const

export function EventCreateDialog({
  date,
  hour,
  onClose,
  onCreated,
}: {
  readonly date: Date
  readonly hour: number
  readonly onClose: () => void
  readonly onCreated: () => void
}) {
  const { data: students } = useStudents()
  const activeStudents = students?.filter((s) => s.status === 'active') ?? []

  async function handleSubmit(formData: FormData) {
    const studentId = formData.get('student_id') as string
    const startHour = Number(formData.get('start_hour'))
    const duration = Number(formData.get('duration'))
    const templateType = formData.get('template_type') as string
    const repeatWeeks = Number(formData.get('repeat_weeks')) || 0

    const startAt = new Date(date)
    startAt.setHours(startHour, 0, 0, 0)
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + duration)

    const baseEvent = {
      student_id: studentId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: 'scheduled' as const,
      template_type: templateType || null,
      recurrence_rule: null,
      color: null,
    }

    if (repeatWeeks > 1) {
      await createRecurringEvents(baseEvent, repeatWeeks)
    } else {
      await createScheduleEvent(baseEvent)
    }
    onCreated()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            수업 추가 - {format(date, 'M월 d일 (EEE)', { locale: ko })}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>학생 *</Label>
            <Select name="student_id" required>
              <SelectTrigger><SelectValue placeholder="학생 선택" /></SelectTrigger>
              <SelectContent>
                {activeStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name_ko} ({s.school})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>시작 시간</Label>
              <Input name="start_hour" type="number" min={8} max={22} defaultValue={hour} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>수업 시간 (분)</Label>
              <Input name="duration" type="number" min={30} step={30} defaultValue={60} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>수업 유형</Label>
            <Select name="template_type">
              <SelectTrigger><SelectValue placeholder="선택 (선택사항)" /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>반복 (주)</Label>
            <Input name="repeat_weeks" type="number" min={0} max={52} defaultValue={0} placeholder="0 = 반복 없음" />
          </div>
          <Button type="submit" className="w-full">수업 추가</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Schedule 페이지 연결**

```tsx
// app/(authenticated)/schedule/page.tsx
import { ThreeWeekCalendar } from '@/components/schedule/three-week-calendar'

export default function SchedulePage() {
  return <ThreeWeekCalendar />
}
```

**Step 5: 빌드 확인 + Commit**

```bash
npm run build
git add app/(authenticated)/schedule/ components/schedule/ lib/utils/date.ts
git commit -m "[feat] 3주 슬라이딩 캘린더 UI + 수업 이벤트 생성"
```

---

## Task 11: 수업 기록 슬라이드 패널 ✅

**Files:**
- Create: `components/schedule/lesson-note-panel.tsx`
- Create: `app/actions/lesson-notes.ts`
- Create: `app/actions/scores.ts`
- Modify: `components/schedule/three-week-calendar.tsx` (이벤트 클릭 시 패널 연결)

**Step 1: 수업 기록 + 성적 Server Actions**

```typescript
// app/actions/lesson-notes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LessonNoteInsert } from '@/lib/types/database'

export async function getLessonNote(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('event_id', eventId)
    .single()
  return data
}

export async function upsertLessonNote(input: LessonNoteInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_notes')
    .upsert(input, { onConflict: 'event_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}

export async function getPreviousLessonNote(studentId: string, beforeDate: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_notes')
    .select('*, schedule_events(start_at, template_type)')
    .eq('student_id', studentId)
    .lt('created_at', beforeDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}
```

```typescript
// app/actions/scores.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ScoreRecordInsert } from '@/lib/types/database'

export async function createScoreRecord(input: ScoreRecordInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('score_records')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  return data
}

export async function getStudentScores(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('score_records')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
```

**Step 2: 수업 기록 슬라이드 패널**

```tsx
// components/schedule/lesson-note-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { getLessonNote, upsertLessonNote, getPreviousLessonNote } from '@/app/actions/lesson-notes'
import { createScoreRecord } from '@/app/actions/scores'
import { updateScheduleEvent } from '@/app/actions/schedule'
import type { ScheduleEventWithStudent, LessonNote } from '@/lib/types/database'

const TEMPLATE_TYPES = ['IO', 'Writing', 'Reading', 'Listening', 'Speaking'] as const
const ASSESSMENT_TYPES = ['IO mock', 'Writing', 'Listening', 'Reading', 'Quiz', 'Exam'] as const

export function LessonNotePanel({
  event,
  onClose,
  onUpdated,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClose: () => void
  readonly onUpdated: () => void
}) {
  const [existingNote, setExistingNote] = useState<LessonNote | null>(null)
  const [previousNote, setPreviousNote] = useState<string | null>(null)
  const [showScore, setShowScore] = useState(false)

  useEffect(() => {
    getLessonNote(event.id).then(setExistingNote)
    getPreviousLessonNote(event.student_id, event.start_at).then((note) => {
      if (note) setPreviousNote(note.content ?? null)
    })
  }, [event.id, event.student_id, event.start_at])

  async function handleSave(formData: FormData) {
    await upsertLessonNote({
      event_id: event.id,
      student_id: event.student_id,
      content: formData.get('content') as string,
      homework: (formData.get('homework') as string) || null,
      next_goal: (formData.get('next_goal') as string) || null,
    })

    // 이벤트 상태를 completed로 변경
    await updateScheduleEvent(event.id, { status: 'completed' })

    // 성적 기록이 있으면 저장
    if (showScore) {
      const assessmentType = formData.get('assessment_type') as string
      const score = Number(formData.get('score'))
      if (assessmentType && score) {
        await createScoreRecord({
          student_id: event.student_id,
          event_id: event.id,
          assessment_type: assessmentType,
          score,
          max_score: 7,
          comment: (formData.get('score_comment') as string) || null,
          date: format(new Date(event.start_at), 'yyyy-MM-dd'),
        })
      }
    }

    onUpdated()
  }

  async function handleCancel() {
    await updateScheduleEvent(event.id, { status: 'cancelled' })
    onUpdated()
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {event.students?.name_ko}
            <Badge variant="outline">{event.template_type ?? '일반'}</Badge>
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(event.start_at), 'M월 d일 (EEE) HH:mm', { locale: ko })}
            {' - '}
            {format(new Date(event.end_at), 'HH:mm')}
          </p>
        </SheetHeader>

        {/* 이전 수업 미리보기 */}
        {previousNote && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">이전 수업 메모</p>
            <p className="mt-1 text-sm">{previousNote}</p>
          </div>
        )}

        <Separator className="my-4" />

        <form action={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>오늘 한 것 *</Label>
            <Textarea
              name="content"
              placeholder="오늘 수업 내용..."
              defaultValue={existingNote?.content ?? ''}
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>숙제</Label>
            <Textarea
              name="homework"
              placeholder="숙제 내용..."
              defaultValue={existingNote?.homework ?? ''}
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>다음 목표</Label>
            <Textarea
              name="next_goal"
              placeholder="다음 수업 목표..."
              defaultValue={existingNote?.next_goal ?? ''}
              rows={2}
            />
          </div>

          {/* 성적 기록 토글 */}
          <Separator />
          <Button type="button" variant="outline" size="sm" onClick={() => setShowScore(!showScore)}>
            {showScore ? '성적 기록 숨기기' : '+ 성적 기록 추가'}
          </Button>

          {showScore && (
            <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
              <div className="flex flex-col gap-2">
                <Label>평가 유형</Label>
                <Select name="assessment_type">
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>점수 (0-7)</Label>
                <Input name="score" type="number" min={0} max={7} step={0.5} />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label>코멘트</Label>
                <Input name="score_comment" placeholder="선택 사항" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">완료 (기록 저장)</Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleCancel}>
              수업 취소
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

**Step 3: ThreeWeekCalendar에 패널 연결**

`three-week-calendar.tsx`에서 `selectedEvent` 상태가 있을 때 `LessonNotePanel`을 렌더링하도록 수정.

기존 코드에 다음 추가:
```tsx
import { LessonNotePanel } from './lesson-note-panel'

// ... 컴포넌트 하단, EventCreateDialog 다음에:
{selectedEvent && (
  <LessonNotePanel
    event={selectedEvent}
    onClose={() => setSelectedEvent(null)}
    onUpdated={() => {
      setSelectedEvent(null)
      mutate()
    }}
  />
)}
```

**Step 4: 빌드 확인 + Commit**

```bash
npm run build
git add app/actions/ components/schedule/
git commit -m "[feat] 수업 기록 슬라이드 패널 + 성적 기록 인라인 추가"
```

---

## Task 12: 상담 로그 CRUD ✅

**Files:**
- Create: `app/actions/consultations.ts`
- Create: `components/students/consultation-log-tab.tsx`
- Modify: `components/students/student-tabs.tsx` (상담 로그 탭 연결)

**Step 1: 상담 로그 Server Actions**

```typescript
// app/actions/consultations.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ConsultationLogInsert } from '@/lib/types/database'

export async function getConsultationLogs(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultation_logs')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createConsultationLog(input: ConsultationLogInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultation_logs')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/students')
  return data
}

export async function deleteConsultationLog(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('consultation_logs')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/students')
}

export async function searchConsultationLogs(query: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultation_logs')
    .select('*, students(name_ko, school)')
    .ilike('content', `%${query}%`)
    .order('date', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data
}
```

**Step 2: 상담 로그 탭 컴포넌트**

학생 상세 페이지의 "상담 로그" 탭에 들어가는 컴포넌트. 상담 추가 폼 + 로그 리스트 + 키워드 검색.

```tsx
// components/students/consultation-log-tab.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getConsultationLogs, createConsultationLog, deleteConsultationLog } from '@/app/actions/consultations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ConsultationLog } from '@/lib/types/database'

const LOG_TYPES = [
  { value: 'consultation', label: '상담', color: 'bg-blue-100 text-blue-800' },
  { value: 'complaint', label: '컴플레인', color: 'bg-red-100 text-red-800' },
  { value: 'request', label: '요청', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'notice', label: '공지', color: 'bg-green-100 text-green-800' },
] as const

export function ConsultationLogTab({ studentId }: { readonly studentId: string }) {
  const [logs, setLogs] = useState<ConsultationLog[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getConsultationLogs(studentId).then(setLogs)
  }, [studentId])

  const filtered = logs.filter((log) =>
    log.content.toLowerCase().includes(search.toLowerCase()) ||
    log.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSubmit(formData: FormData) {
    const tagsRaw = formData.get('tags') as string
    await createConsultationLog({
      student_id: studentId,
      event_id: null,
      type: formData.get('type') as ConsultationLog['type'],
      content: formData.get('content') as string,
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()) : null,
      date: new Date().toISOString(),
    })
    const updated = await getConsultationLogs(studentId)
    setLogs(updated)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteConsultationLog(id)
    setLogs(logs.filter((l) => l.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="검색 (키워드/태그)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '취소' : '상담 추가'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>유형 *</Label>
                  <Select name="type" required>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {LOG_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>태그 (콤마 구분)</Label>
                  <Input name="tags" placeholder="숙제불만, 점수문의" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>내용 *</Label>
                <Textarea name="content" rows={4} required placeholder="상담 내용..." />
              </div>
              <Button type="submit" size="sm">저장</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((log) => {
          const typeInfo = LOG_TYPES.find((t) => t.value === log.type)
          return (
            <Card key={log.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={typeInfo?.color}>
                      {typeInfo?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.date), 'M월 d일 HH:mm', { locale: ko })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{log.content}</p>
                  {log.tags && log.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {log.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => handleDelete(log.id)}
                >
                  삭제
                </Button>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">상담 로그가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
```

**Step 3: StudentTabs에 연결**

`student-tabs.tsx`의 상담 로그 TabsContent를 업데이트:

```tsx
import { ConsultationLogTab } from './consultation-log-tab'

// ...
<TabsContent value="consultations">
  <ConsultationLogTab studentId={student.id} />
</TabsContent>
```

**Step 4: 빌드 확인 + Commit**

```bash
npm run build
git add app/actions/consultations.ts components/students/
git commit -m "[feat] 상담 로그 CRUD + 검색 + 태그"
```

---

## Task 13: 학생 상세 - 수업기록/성적 탭 채우기 ✅

**Files:**
- Create: `components/students/lesson-history-tab.tsx`
- Create: `components/students/score-tab.tsx`
- Modify: `components/students/student-tabs.tsx`

**Step 1: 수업기록 탭**

학생의 모든 수업 기록을 타임라인 형태로 표시.

```tsx
// components/students/lesson-history-tab.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LessonNote, ScheduleEvent } from '@/lib/types/database'

type LessonWithEvent = LessonNote & {
  schedule_events: Pick<ScheduleEvent, 'start_at' | 'template_type' | 'status'>
}

export function LessonHistoryTab({ studentId }: { readonly studentId: string }) {
  const [lessons, setLessons] = useState<LessonWithEvent[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('lesson_notes')
      .select('*, schedule_events(start_at, template_type, status)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setLessons(data as LessonWithEvent[])
      })
  }, [studentId])

  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">수업 기록이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {format(new Date(lesson.schedule_events.start_at), 'M월 d일 (EEE)', { locale: ko })}
              </span>
              {lesson.schedule_events.template_type && (
                <Badge variant="secondary">{lesson.schedule_events.template_type}</Badge>
              )}
            </div>
            {lesson.content && <p className="mt-2 text-sm">{lesson.content}</p>}
            {lesson.homework && (
              <p className="mt-1 text-sm text-muted-foreground">숙제: {lesson.homework}</p>
            )}
            {lesson.next_goal && (
              <p className="mt-1 text-sm text-muted-foreground">다음 목표: {lesson.next_goal}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Step 2: 성적 추이 탭**

점수 리스트 + 간단 차트 (Recharts).

```tsx
// components/students/score-tab.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { getStudentScores } from '@/app/actions/scores'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ScoreRecord } from '@/lib/types/database'

export function ScoreTab({ studentId }: { readonly studentId: string }) {
  const [scores, setScores] = useState<ScoreRecord[]>([])

  useEffect(() => {
    getStudentScores(studentId).then(setScores)
  }, [studentId])

  if (scores.length === 0) {
    return <p className="text-sm text-muted-foreground">성적 기록이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {scores.map((score) => (
        <Card key={score.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{format(new Date(score.date), 'M/d')}</span>
              <Badge variant="outline">{score.assessment_type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{score.score}</span>
              <span className="text-sm text-muted-foreground">/ {score.max_score}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Step 3: StudentTabs에 연결**

```tsx
import { LessonHistoryTab } from './lesson-history-tab'
import { ScoreTab } from './score-tab'

// ...
<TabsContent value="lessons">
  <LessonHistoryTab studentId={student.id} />
</TabsContent>
<TabsContent value="scores">
  <ScoreTab studentId={student.id} />
</TabsContent>
```

**Step 4: 빌드 확인 + Commit**

```bash
npm run build
git add components/students/
git commit -m "[feat] 학생 상세 수업기록/성적 탭 구현"
```

---

## Task 14: Dashboard 구현 ✅

**Files:**
- Modify: `app/(authenticated)/page.tsx`
- Create: `components/dashboard/today-lessons.tsx`
- Create: `components/dashboard/recent-consultations.tsx`
- Create: `components/dashboard/incomplete-lessons.tsx`

**Step 1: 오늘 수업 리스트**

```tsx
// components/dashboard/today-lessons.tsx
'use client'

import { useEffect, useState } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

export function TodayLessons() {
  const [events, setEvents] = useState<ScheduleEventWithStudent[]>([])

  useEffect(() => {
    const supabase = createClient()
    const today = new Date()
    supabase
      .from('schedule_events')
      .select('*, students(id, name_ko, name_en, school, ib_course)')
      .gte('start_at', startOfDay(today).toISOString())
      .lte('start_at', endOfDay(today).toISOString())
      .order('start_at')
      .then(({ data }) => {
        if (data) setEvents(data as ScheduleEventWithStudent[])
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 수업</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">오늘 예정된 수업이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <span className="font-medium">{event.students?.name_ko}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {format(new Date(event.start_at), 'HH:mm')} - {format(new Date(event.end_at), 'HH:mm')}
                  </span>
                </div>
                <Badge variant={event.status === 'completed' ? 'default' : 'outline'}>
                  {event.status === 'scheduled' ? '예정' : event.status === 'completed' ? '완료' : event.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Step 2: 최근 상담 로그**

```tsx
// components/dashboard/recent-consultations.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ConsultationWithStudent = {
  readonly id: string
  readonly type: string
  readonly content: string
  readonly date: string
  readonly students: { readonly name_ko: string }
}

export function RecentConsultations() {
  const [logs, setLogs] = useState<ConsultationWithStudent[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('consultation_logs')
      .select('id, type, content, date, students(name_ko)')
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setLogs(data as unknown as ConsultationWithStudent[])
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 상담</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">상담 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{log.students.name_ko}</span>
                  <Badge variant="outline" className="text-xs">{log.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.date), 'M/d', { locale: ko })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{log.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Step 3: 미완료 수업 알림**

```tsx
// components/dashboard/incomplete-lessons.tsx
'use client'

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type IncompleteEvent = {
  readonly id: string
  readonly start_at: string
  readonly students: { readonly name_ko: string }
}

export function IncompleteLessons() {
  const [events, setEvents] = useState<IncompleteEvent[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('schedule_events')
      .select('id, start_at, students(name_ko)')
      .eq('status', 'scheduled')
      .lt('start_at', new Date().toISOString())
      .gte('start_at', subDays(new Date(), 7).toISOString())
      .order('start_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data as unknown as IncompleteEvent[])
      })
  }, [])

  if (events.length === 0) return null

  return (
    <Card className="border-yellow-300">
      <CardHeader>
        <CardTitle className="text-yellow-700">미완료 수업 ({events.length}건)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <Link key={event.id} href="/schedule" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
              <span className="text-sm font-medium">{event.students.name_ko}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.start_at), 'M/d HH:mm', { locale: ko })}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 4: Dashboard 페이지 조합**

```tsx
// app/(authenticated)/page.tsx
import { TodayLessons } from '@/components/dashboard/today-lessons'
import { RecentConsultations } from '@/components/dashboard/recent-consultations'
import { IncompleteLessons } from '@/components/dashboard/incomplete-lessons'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <IncompleteLessons />
      <div className="grid gap-6 md:grid-cols-2">
        <TodayLessons />
        <RecentConsultations />
      </div>
    </div>
  )
}
```

**Step 5: 빌드 확인 + Commit**

```bash
npm run build
git add app/(authenticated)/page.tsx components/dashboard/
git commit -m "[feat] Dashboard (오늘 수업, 최근 상담, 미완료 수업)"
```

---

## Task 15: 최종 검증 + 정리 ✅

**Step 1: 빌드 + 린트 확인**

```bash
npm run build && npm run lint
```

**Step 2: 전체 페이지 동작 확인 체크리스트**

- [ ] `/login` → 비밀번호 입력 → `/` 리다이렉트
- [ ] `/students` → 학생 카드 보드 표시
- [ ] 학생 추가 → 카드에 반영
- [ ] 학생 클릭 → 상세 페이지 (5개 탭)
- [ ] 프로필 수정/삭제
- [ ] `/schedule` → 3주 캘린더 표시
- [ ] 캘린더 셀 클릭 → 수업 추가 다이얼로그
- [ ] 이벤트 클릭 → 수업 기록 패널
- [ ] 수업 기록 저장 → 이벤트 상태 completed
- [ ] 상담 로그 탭 → 추가/검색/삭제
- [ ] Dashboard → 오늘 수업, 최근 상담, 미완료 수업

**Step 3: Commit**

```bash
git add -A
git commit -m "[chore] MVP-0 최종 정리 및 검증"
```

---

## Summary

| Task | 내용 | 예상 커밋 |
|------|------|----------|
| 1 | shadcn/ui + 의존성 | `[chore] shadcn/ui 초기화` |
| 2 | Supabase 연동 | `[chore] Supabase 클라이언트` |
| 3 | DB 스키마 + 타입 | `[chore] DB 스키마 마이그레이션` |
| 4 | 패스워드 게이트 | `[feat] 패스워드 인증` |
| 5 | 레이아웃 + 네비게이션 | `[feat] 앱 레이아웃` |
| 6 | 학생 CRUD + SWR | `[feat] 학생 CRUD` |
| 7 | 학생 카드 보드 | `[feat] 학생 Kanban 보드` |
| 8 | 학생 상세 + 프로필 | `[feat] 학생 상세 페이지` |
| 9 | 스케줄 CRUD + SWR | `[feat] 스케줄 CRUD` |
| 10 | 3주 캘린더 UI | `[feat] 3주 캘린더` |
| 11 | 수업 기록 패널 | `[feat] 수업 기록 패널` |
| 12 | 상담 로그 | `[feat] 상담 로그` |
| 13 | 수업기록/성적 탭 | `[feat] 수업기록/성적 탭` |
| 14 | Dashboard | `[feat] Dashboard` |
| 15 | 최종 검증 | `[chore] 최종 정리` |
