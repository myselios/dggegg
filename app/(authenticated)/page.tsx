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
import { STAT_STYLES } from '@/lib/constants/status-styles'
import { TodayLessons } from '@/components/dashboard/today-lessons'
import { RecentConsultations } from '@/components/dashboard/recent-consultations'
import { IncompleteLessons } from '@/components/dashboard/incomplete-lessons'
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule'
import { LessonStats } from '@/components/dashboard/lesson-stats'
import { PaymentAlerts } from '@/components/dashboard/payment-alerts'
import { StatCard } from '@/components/dashboard/stat-card'

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    incomplete: 0,
  })

  useEffect(() => {
    async function loadStats() {
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
    // 통계를 먼저 그리고, 지난 수업 자동 완료는 병렬 실행 후 완료되면 통계만 갱신
    loadStats()
    autoCompletePastEvents().then(() => loadStats()).catch(() => {})
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
      {/* 오늘 수업 - 큰 타일 (좌측, 2행) */}
      <div className="bento-tile lg:col-span-3 lg:row-span-2">
        <TodayLessons />
      </div>

      {/* 통계 3종 - 작은 타일 묶음 (우측 상단) */}
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STAT_CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={stats[card.key as keyof DashboardStats]}
              icon={card.icon}
              cardClassName={card.style.card}
              iconBgClassName={card.style.iconBg}
            />
          ))}
        </div>
      </div>

      {/* 수업 통계 차트 (우측 하단) */}
      <div className="bento-tile lg:col-span-3">
        <LessonStats />
      </div>

      {/* 주간 스케줄 - 와이드 타일 */}
      <div className="bento-tile lg:col-span-6">
        <WeeklySchedule />
      </div>

      {/* 미완료 수업 알림 (0건이면 자체적으로 숨김) */}
      <div className="bento-tile lg:col-span-3">
        <IncompleteLessons />
      </div>

      {/* 정산 알림 (0건이면 자체적으로 숨김) */}
      <div className="bento-tile lg:col-span-3">
        <PaymentAlerts />
      </div>

      {/* 최근 상담 - 와이드 타일 */}
      <div className="bento-tile lg:col-span-6">
        <RecentConsultations />
      </div>
    </div>
  )
}
