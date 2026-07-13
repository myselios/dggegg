'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getStudentProgress, refreshStudentProgress } from '@/app/actions/student-materials'
import type { SessionSummary } from '@/lib/types/database'

type Props = {
  readonly studentId: string
  readonly studentName: string
}

type State =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly summaries: readonly SessionSummary[] }
  | { readonly status: 'error'; readonly message: string }

export function StudentProgressCard({ studentId, studentName }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getStudentProgress(studentId)
      .then((result) => {
        if (cancelled) return
        if (result.success) {
          setState({ status: 'success', summaries: result.data })
        } else {
          setState({ status: 'error', message: result.error })
        }
      })
    return () => {
      cancelled = true
      setState({ status: 'loading' })
    }
  }, [studentId])

  const handleRefresh = async () => {
    setState({ status: 'loading' })
    const result = await refreshStudentProgress(studentId)
    if (result.success) {
      setState({ status: 'success', summaries: result.data })
      toast.success('진도현황이 업데이트되었습니다')
    } else {
      setState({ status: 'error', message: result.error })
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{studentName} — AI 진도현황</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={state.status === 'loading'}
          className="h-8 gap-1.5 px-2 text-xs"
        >
          <RefreshCw className={`size-3 ${state.status === 'loading' ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && state.summaries.length === 0 && <EmptyState />}
      {state.status === 'success' && state.summaries.length > 0 && (
        <SummaryList summaries={state.summaries} />
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-2 rounded-2xl py-10 text-muted-foreground">
      <RefreshCw className="size-5 animate-spin text-primary" />
      <span className="text-sm">AI 요약 생성 중...</span>
    </div>
  )
}

function ErrorState({ message }: { readonly message: string }) {
  return (
    <div className="glass-card rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
      {message}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
      아직 요약된 내용이 없습니다.
    </div>
  )
}

function SummaryList({ summaries }: { readonly summaries: readonly SessionSummary[] }) {
  return (
    <div className="space-y-2.5">
      {summaries.map((item) => (
        <SummaryItem key={item.session} item={item} />
      ))}
    </div>
  )
}

function SummaryItem({ item }: { readonly item: SessionSummary }) {
  return (
    <div className="glass-card space-y-2 rounded-2xl p-4">
      <Badge
        variant="outline"
        className="border-primary/20 bg-primary/5 px-2 py-0 text-[11px] font-semibold text-primary"
      >
        {item.session}
      </Badge>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
        {item.summary}
      </p>
    </div>
  )
}
