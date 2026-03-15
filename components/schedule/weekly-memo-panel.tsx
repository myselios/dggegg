'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, getISOWeek, getYear } from 'date-fns'
import { ko } from 'date-fns/locale'
import { NotebookPen, Check } from 'lucide-react'
import { getWeeklyMemo, upsertWeeklyMemo } from '@/app/actions/weekly-memos'

/** ISO week key — e.g. "2026-W11" */
function toWeekKey(date: Date): string {
  const week = String(getISOWeek(date)).padStart(2, '0')
  return `${getYear(date)}-W${week}`
}

export function WeeklyMemoPanel({ baseDate }: { readonly baseDate: Date }) {
  const weekKey = toWeekKey(baseDate)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedKey = useRef('')

  // Load memo when week changes
  useEffect(() => {
    let cancelled = false

    getWeeklyMemo(weekKey).then((result) => {
      if (cancelled) return
      setContent(result.success && result.data ? result.data.content : '')
      setSaved(true)
      lastSavedKey.current = weekKey
    })

    return () => { cancelled = true }
  }, [weekKey])

  // Debounced auto-save (1.5s after last keystroke)
  const handleChange = useCallback((value: string) => {
    setContent(value)
    setSaved(false)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      await upsertWeeklyMemo(weekKey, value)
      setSaving(false)
      setSaved(true)
    }, 1500)
  }, [weekKey])

  // Save on blur immediately
  const handleBlur = useCallback(async () => {
    if (saved) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaving(true)
    await upsertWeeklyMemo(weekKey, content)
    setSaving(false)
    setSaved(true)
  }, [saved, weekKey, content])

  const weekLabel = (() => {
    const start = new Date(baseDate)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${format(start, 'M/d', { locale: ko })} — ${format(end, 'M/d', { locale: ko })}`
  })()

  return (
    <div className="glass-card flex flex-col rounded-2xl p-3 gap-2 w-72 shrink-0 self-start sticky top-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <NotebookPen className="w-4 h-4 text-primary" />
          <span>주간 메모</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {saving ? (
            <span className="animate-pulse">저장 중…</span>
          ) : saved ? (
            <span className="flex items-center gap-0.5 text-green-500">
              <Check className="w-3 h-3" /> 저장됨
            </span>
          ) : (
            <span>수정 중</span>
          )}
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground font-medium px-0.5">{weekLabel}</div>

      <textarea
        className="flex-1 w-full min-h-[500px] resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground/50"
        placeholder="이번 주 메모를 자유롭게 적어보세요…"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  )
}
