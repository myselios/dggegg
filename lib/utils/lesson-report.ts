import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export type LessonReportData = {
  readonly studentName: string
  readonly lessonDate: Date
  readonly content: string
  readonly homework: string
  readonly nextGoal: string
  readonly score: number | null
}

export const DEFAULT_LESSON_REPORT_TEMPLATE = `[{{학생이름}} {{날짜}} 수업 리포트]
✏️ 오늘 한 것: {{오늘한것}}
📚 숙제: {{숙제}}
🎯 다음 목표: {{다음목표}}
📊 점수: {{점수}}`

const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g

function resolvePlaceholderValues(data: LessonReportData): Readonly<Record<string, string>> {
  return {
    학생이름: data.studentName.trim(),
    날짜: format(data.lessonDate, 'M월 d일 (EEE)', { locale: ko }),
    오늘한것: data.content.trim(),
    숙제: data.homework.trim(),
    다음목표: data.nextGoal.trim(),
    점수: data.score != null ? String(data.score) : '',
  }
}

function isLineDroppable(line: string, values: Readonly<Record<string, string>>): boolean {
  const matches = [...line.matchAll(PLACEHOLDER_PATTERN)]
  return matches.some(([, key]) => key in values && values[key] === '')
}

function substitutePlaceholders(line: string, values: Readonly<Record<string, string>>): string {
  return line.replace(PLACEHOLDER_PATTERN, (match, key: string) =>
    key in values ? values[key] : match
  )
}

/**
 * 템플릿 문자열의 {{플레이스홀더}}를 실제 값으로 치환한다.
 * 값이 빈 문자열인 플레이스홀더가 포함된 줄은 통째로 제거한다 (빈 줄 방지).
 */
export function buildLessonReport(template: string, data: LessonReportData): string {
  const values = resolvePlaceholderValues(data)

  return template
    .split('\n')
    .filter((line) => !isLineDroppable(line, values))
    .map((line) => substitutePlaceholders(line, values))
    .join('\n')
}
