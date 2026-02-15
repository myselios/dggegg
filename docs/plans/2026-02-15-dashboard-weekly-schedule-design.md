# Dashboard Weekly Schedule Widget Design

> Date: 2026-02-15
> Status: Approved

## Overview

대시보드의 기존 3주 미니캘린더를 **이번 주 스케줄 요일 컬럼형 위젯**으로 교체한다.
목표: 이번 주 수업 배치를 한눈에 파악할 수 있는 간결한 뷰.

## Design

### Layout (요일 컬럼형)

```
┌─ 📅 이번 주 스케줄 ───────────── 전체보기 → ─┐
│                                                │
│  월 10       화 11       수 12(오늘) 목 13     │
│  ─────       ─────       ──────────  ─────     │
│  14:00 김민수  10:00 박지영  09:00 이수진        │
│  16:00 이수진  14:00 최하늘  14:00 김민수        │
│               16:30 김민수  16:00 박지영        │
│                                                │
│  금 14       토 15       일 16                 │
│  ─────       ─────       ─────                 │
│  10:00 박지영  09:00 최하늘  —                  │
│  15:00 최하늘                                   │
│                                                │
│  ────────────────────────────────────────────  │
│  이번 주 총 11건  완료 3 · 예정 8              │
└────────────────────────────────────────────────┘
```

### Design Details

| Element | Style |
|---------|-------|
| Card Header | CalendarDays icon + "이번 주 스케줄" + right-aligned "전체보기 →" link |
| Day Header | `요일 날짜` (e.g., "월 10"), today highlighted with primary color + ring |
| Lesson Item | `HH:mm 학생명` (e.g., "14:00 김민수"), time in tabular-nums |
| Empty Day | `—` dash symbol |
| Footer Summary | Total count + completed/scheduled breakdown |
| Weekend Colors | Saturday blue, Sunday red (existing pattern) |
| Click Action | Day click → `/schedule?date=YYYY-MM-DD` |
| Grid | Top row: Mon-Thu (4 cols), Bottom row: Fri-Sun (3 cols), responsive |

### Data

- Reuse `useScheduleEvents` hook (change range to this week only)
- Use `ScheduleEventWithStudent` type for student name access

### Changes from Current

| Before (3-week mini-calendar) | After (weekly schedule) |
|-------------------------------|------------------------|
| 21-day date grid | 7-day column layout |
| Completed/scheduled progress bars | Time + name text list |
| Per-week count | Single weekly summary |
| Component: MiniCalendar | Component: WeeklySchedule |
