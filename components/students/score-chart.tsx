'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ScoreRecord } from '@/lib/types/database'

type ChartDataPoint = {
  readonly date: string
  readonly score: number
  readonly assessmentType: string
  readonly comment: string | null
  readonly maxScore: number
}

const FILTER_ALL = 'all'

function extractAssessmentTypes(scores: readonly ScoreRecord[]): readonly string[] {
  const types = new Set(scores.map((s) => s.assessment_type))
  return Array.from(types).sort()
}

function toChartData(
  scores: readonly ScoreRecord[],
  filter: string
): readonly ChartDataPoint[] {
  const filtered = filter === FILTER_ALL
    ? scores
    : scores.filter((s) => s.assessment_type === filter)

  return filtered
    .filter((s) => s.score !== null)
    .map((s) => ({
      date: s.date,
      score: s.score as number,
      assessmentType: s.assessment_type,
      comment: s.comment,
      maxScore: s.max_score,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function CustomTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload as ChartDataPoint

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">
        {format(new Date(data.date), 'yyyy년 M월 d일', { locale: ko })}
      </p>
      <p className="text-sm font-medium">{data.assessmentType}</p>
      <p className="text-lg font-bold tabular-nums">
        {data.score} <span className="text-sm font-normal text-muted-foreground">/ {data.maxScore}</span>
      </p>
      {data.comment && (
        <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
          {data.comment}
        </p>
      )}
    </div>
  )
}

export function ScoreChart({ scores }: { readonly scores: readonly ScoreRecord[] }) {
  const [filter, setFilter] = useState(FILTER_ALL)

  const assessmentTypes = useMemo(() => extractAssessmentTypes(scores), [scores])
  const chartData = useMemo(() => toChartData(scores, filter), [scores, filter])

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {filter === FILTER_ALL
            ? '점수가 기록된 성적이 없습니다'
            : `${filter} 유형의 점수 기록이 없습니다`}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">성적 추이</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="평가 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>전체</SelectItem>
            {assessmentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData as ChartDataPoint[]} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(new Date(value), 'M/d')}
              className="text-xs"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 7]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
              className="text-xs"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={CustomTooltip} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{
                fill: 'var(--color-primary)',
                stroke: 'var(--color-background)',
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                fill: 'var(--color-primary)',
                stroke: 'var(--color-background)',
                strokeWidth: 2,
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
