'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Clock, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useLessonStats } from '@/lib/hooks/use-lesson-stats'
import { round1, type DayPoint, type WeekPoint } from '@/lib/utils/lesson-stats'

function TrendBadge({ current, prev }: { readonly current: number; readonly prev: number }) {
  const diff = round1(current - prev)
  if (diff === 0) return <Minus className="size-3 text-muted-foreground" />
  const up = diff > 0
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-xs font-medium',
        up ? 'text-emerald-500' : 'text-rose-500',
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? '+' : ''}
      {diff}h
    </span>
  )
}

function WeekTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}주</p>
      <p className="text-sm font-bold tabular-nums">{payload[0].value}h</p>
    </div>
  )
}

function DayTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}요일</p>
      <p className="text-sm font-bold tabular-nums">{payload[0].value}h</p>
    </div>
  )
}

export function LessonStats() {
  const { summary, weeklyData, dailyData, lastWeekLabel } = useLessonStats()

  return (
    <Card className="glass-card rounded-2xl border-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900">
            <Clock className="size-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          수업 통계
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Summary row */}
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              지난주 ({lastWeekLabel})
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold tabular-nums leading-tight">
                {summary.lastWeekHours}h
              </span>
              <span className="text-xs text-muted-foreground">{summary.lastWeekCount}건</span>
              <TrendBadge current={summary.lastWeekHours} prev={summary.prevWeekHours} />
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              이번 달
            </p>
            <span className="text-2xl font-bold tabular-nums leading-tight mt-0.5 block">
              {summary.thisMonthHours}h
            </span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Line chart: 8-week trend */}
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              주별 수업 시간 (최근 8주)
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyData as WeekPoint[]}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <Tooltip content={WeekTooltip} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{
                      fill: 'var(--color-primary)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 2,
                      r: 3,
                    }}
                    activeDot={{
                      fill: 'var(--color-primary)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 2,
                      r: 5,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart: last week daily */}
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              지난주 요일별 ({lastWeekLabel})
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData as DayPoint[]}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <Tooltip content={DayTooltip} />
                  <Bar
                    dataKey="hours"
                    fill="oklch(0.5 0.19 265 / 80%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    activeBar={{ fill: 'var(--color-primary)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
