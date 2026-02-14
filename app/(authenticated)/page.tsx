import { TodayLessons } from '@/components/dashboard/today-lessons'
import { RecentConsultations } from '@/components/dashboard/recent-consultations'
import { IncompleteLessons } from '@/components/dashboard/incomplete-lessons'

export const dynamic = 'force-dynamic'

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
