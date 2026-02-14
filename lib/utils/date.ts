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
