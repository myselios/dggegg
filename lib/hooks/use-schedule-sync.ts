'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { mutate as globalMutate } from 'swr'
import { autoCompletePastEvents } from '@/app/actions/schedule'

let version = 0
const listeners = new Set<() => void>()

function notify() {
  version++
  listeners.forEach((listener) => listener())
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot() {
  return version
}

function getServerSnapshot() {
  return 0
}

/**
 * 지난 수업이 완료 처리(자동 또는 수동)될 때마다 값이 바뀐다.
 * useEffect 의존성에 넣으면 변경 시점에 직접 fetch(useState 기반) 컴포넌트를 재조회시킬 수 있다.
 */
export function useScheduleSyncVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * 스케줄이 바뀌었음을 전역에 알린다.
 * - useScheduleSyncVersion 구독자(TodayLessons, IncompleteLessons, 대시보드 통계 등) 갱신
 * - SWR 'schedule-events' 캐시(WeeklySchedule, LessonStats, ThreeWeekCalendar) 재검증
 */
export function notifyScheduleChanged(): void {
  notify()
  globalMutate((key) => Array.isArray(key) && key[0] === 'schedule-events')
}

const AUTO_COMPLETE_INTERVAL_MS = 5 * 60 * 1000

async function runAutoComplete(): Promise<void> {
  const result = await autoCompletePastEvents()
  if (result.success && result.data > 0) {
    notifyScheduleChanged()
  }
}

/**
 * 지난 수업 자동 완료를 트리거한다. 인증 레이아웃(모든 인증 페이지의 공용 래퍼)에
 * 마운트해서, 어떤 화면으로 먼저 들어오든(대시보드든 스케줄이든) 항상 실행되게 한다.
 * 대시보드 탭을 오래 열어두는 사용 패턴을 고려해, 마운트 시 1회 실행 후에도
 * 주기적으로(5분) 그리고 탭이 다시 포커스될 때마다 재실행해 시간이 지나며
 * 새로 지나간 수업을 계속 완료 처리한다.
 */
export function useAutoCompletePastEvents(): void {
  useEffect(() => {
    runAutoComplete().catch(() => {})

    const interval = setInterval(() => {
      runAutoComplete().catch(() => {})
    }, AUTO_COMPLETE_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        runAutoComplete().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
