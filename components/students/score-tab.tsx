'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import { getStudentScores } from '@/app/actions/scores'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreChart } from './score-chart'
import type { ScoreRecord } from '@/lib/types/database'

export function ScoreTab({ studentId }: { readonly studentId: string }) {
  const [scores, setScores] = useState<ScoreRecord[]>([])

  useEffect(() => {
    getStudentScores(studentId).then(setScores)
  }, [studentId])

  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <TrendingUp className="size-5 text-muted-foreground/50" />
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">성적 기록이 없습니다</p>
        <p className="mt-1 text-xs text-muted-foreground/60">수업 완료 시 성적을 기록하면 추이를 확인할 수 있습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Chart */}
      <ScoreChart scores={scores} />

      {/* Score list */}
      <div className="flex flex-col gap-3">
        {scores.map((score) => (
          <Card key={score.id} className="glass-card border-none rounded-xl">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(score.date), 'M/d')}</span>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-semibold">{score.assessment_type}</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tabular-nums text-primary">{score.score}</span>
                <span className="text-xs text-muted-foreground">/ {score.max_score}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
