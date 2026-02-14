'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { getStudentScores } from '@/app/actions/scores'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ScoreRecord } from '@/lib/types/database'

export function ScoreTab({ studentId }: { readonly studentId: string }) {
  const [scores, setScores] = useState<ScoreRecord[]>([])

  useEffect(() => {
    getStudentScores(studentId).then(setScores)
  }, [studentId])

  if (scores.length === 0) {
    return <p className="text-sm text-muted-foreground">성적 기록이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {scores.map((score) => (
        <Card key={score.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{format(new Date(score.date), 'M/d')}</span>
              <Badge variant="outline">{score.assessment_type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{score.score}</span>
              <span className="text-sm text-muted-foreground">/ {score.max_score}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
