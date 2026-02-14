import { ThreeWeekCalendar } from '@/components/schedule/three-week-calendar'

export const dynamic = 'force-dynamic'

export default async function SchedulePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly date?: string }>
}) {
  const { date } = await searchParams
  return <ThreeWeekCalendar initialDate={date} />
}
