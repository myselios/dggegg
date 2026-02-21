/**
 * 상태별 스타일 중앙 정의
 * 모든 컴포넌트에서 이 상수를 참조하여 일관된 색상 사용
 */

export const SCHEDULE_STATUS = {
  scheduled: {
    label: '예정',
    badge: 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950',
    dot: 'bg-blue-500',
    line: 'bg-blue-200 dark:bg-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  completed: {
    label: '완료',
    badge: 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950',
    dot: 'bg-emerald-500',
    line: 'bg-emerald-200 dark:bg-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  cancelled: {
    label: '취소',
    badge: 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950',
    dot: 'bg-red-400',
    line: 'bg-red-200 dark:bg-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  no_show: {
    label: '미출석',
    badge: 'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-950',
    dot: 'bg-orange-400',
    line: 'bg-orange-200 dark:bg-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
} as const

export const STUDENT_STATUS = {
  active: {
    label: '수업 중',
    border: 'border-t-emerald-500',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  paused: {
    label: '일시 중지',
    border: 'border-t-amber-500',
    icon: 'text-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  ended: {
    label: '종료',
    border: 'border-t-gray-400',
    icon: 'text-gray-400',
    badge: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
  },
} as const

export const CONSULTATION_TYPE = {
  consultation: {
    label: '상담',
    badge: 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  complaint: {
    label: '불만',
    badge: 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  request: {
    label: '요청',
    badge: 'border-violet-200 text-violet-700 bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:bg-violet-950',
    iconBg: 'bg-violet-100 dark:bg-violet-900',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  notice: {
    label: '공지',
    badge: 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
} as const

export const STAT_STYLES = {
  info: {
    card: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
  },
  success: {
    card: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
  },
  warning: {
    card: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
  },
} as const

export const IB_COURSE_STYLES: Record<string, { readonly label: string; readonly className: string }> = {
  'Ab initio': {
    label: 'Ab initio',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  SL: {
    label: 'SL',
    className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  },
  HL: {
    label: 'HL',
    className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
  },
  IGCSE: {
    label: 'IGCSE',
    className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  },
  MYP: {
    label: 'MYP',
    className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  },
  '기타': {
    label: '기타',
    className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
  },
}

export function getScheduleStatus(status: string) {
  return SCHEDULE_STATUS[status as keyof typeof SCHEDULE_STATUS] ?? SCHEDULE_STATUS.scheduled
}

export function getConsultationType(type: string) {
  return CONSULTATION_TYPE[type as keyof typeof CONSULTATION_TYPE] ?? CONSULTATION_TYPE.consultation
}
