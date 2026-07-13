'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ThreeWeekCalendar } from '@/components/schedule/three-week-calendar'

function ScheduleWithParams() {
  const searchParams = useSearchParams()
  const date = searchParams.get('date') ?? undefined
  return <ThreeWeekCalendar initialDate={date} />
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="glass-card h-[70vh] animate-pulse rounded-2xl" />}>
      <ScheduleWithParams />
    </Suspense>
  )
}
