'use client'

import { useEffect, useState } from 'react'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { autoCompletePastEvents } from '@/app/actions/schedule'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { STAT_STYLES } from '@/lib/constants/status-styles'
import { TodayLessons } from '@/components/dashboard/today-lessons'
import { RecentConsultations } from '@/components/dashboard/recent-consultations'
import { IncompleteLessons } from '@/components/dashboard/incomplete-lessons'
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule'
import { LessonStats } from '@/components/dashboard/lesson-stats'

type DashboardStats = {
  readonly total: number
  readonly completed: number
  readonly incomplete: number
}

const STAT_CARDS = [
  { key: 'total', label: '오늘 수업', icon: Calendar, style: STAT_STYLES.info },
  { key: 'completed', label: '완료', icon: CheckCircle2, style: STAT_STYLES.success },
  { key: 'incomplete', label: '미완료', icon: AlertTriangle, style: STAT_STYLES.warning },
] as const

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    incomplete: 0,
  })

  useEffect(() => {
    async function init() {
      await autoCompletePastEvents()

      const supabase = createClient()
      const today = new Date()

      const [todayResult, incompleteResult] = await Promise.all([
        supabase
          .from('schedule_events')
          .select('status')
          .gte('start_at', startOfDay(today).toISOString())
          .lte('start_at', endOfDay(today).toISOString()),
        supabase
          .from('schedule_events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'scheduled')
          .lt('start_at', today.toISOString())
          .gte('start_at', subDays(today, 7).toISOString()),
      ])

      const events = todayResult.data ?? []
      const completedCount = events.filter(
        (e) => e.status === 'completed'
      ).length

      setStats({
        total: events.length,
        completed: completedCount,
        incomplete: incompleteResult.count ?? 0,
      })
    }
    init()
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {/* Lesson Stats */}
      <LessonStats />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          const value = stats[card.key as keyof DashboardStats]

          return (
            <Card
              key={card.key}
              className={cn('glass-card border-none rounded-2xl', card.style.card)}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  card.style.iconBg
                )}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-tight">
                    {value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Incomplete Lessons Alert */}
      <IncompleteLessons />

      {/* Weekly Schedule */}
      <WeeklySchedule />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayLessons />
        <RecentConsultations />
      </div>
    </div>
  )
}
