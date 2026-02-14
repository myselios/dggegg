'use client'

import { useEffect, useState } from 'react'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TodayLessons } from '@/components/dashboard/today-lessons'
import { RecentConsultations } from '@/components/dashboard/recent-consultations'
import { IncompleteLessons } from '@/components/dashboard/incomplete-lessons'

type DashboardStats = {
  readonly total: number
  readonly completed: number
  readonly incomplete: number
}

function useGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '좋은 오후예요'
  return '좋은 저녁이에요'
}

const STAT_CARDS = [
  {
    key: 'total',
    label: '오늘 수업',
    icon: Calendar,
    colorClasses: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    key: 'completed',
    label: '완료',
    icon: CheckCircle2,
    colorClasses: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
  },
  {
    key: 'incomplete',
    label: '미완료',
    icon: AlertTriangle,
    colorClasses: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
  },
] as const

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const greeting = useGreeting()
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    incomplete: 0,
  })

  useEffect(() => {
    const supabase = createClient()
    const today = new Date()

    const fetchTodayStats = supabase
      .from('schedule_events')
      .select('status')
      .gte('start_at', startOfDay(today).toISOString())
      .lte('start_at', endOfDay(today).toISOString())

    const fetchIncompleteStats = supabase
      .from('schedule_events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .lt('start_at', today.toISOString())
      .gte('start_at', subDays(today, 7).toISOString())

    Promise.all([fetchTodayStats, fetchIncompleteStats]).then(
      ([todayResult, incompleteResult]) => {
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
    )
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          'bg-primary/10'
        )}>
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {greeting} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            오늘 하루도 좋은 수업 되세요.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          const value = stats[card.key as keyof DashboardStats]

          return (
            <Card
              key={card.key}
              className={cn(
                'border-none shadow-sm transition-shadow hover:shadow-md',
                card.colorClasses
              )}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  card.iconBg
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium opacity-80">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayLessons />
        <RecentConsultations />
      </div>
    </div>
  )
}
