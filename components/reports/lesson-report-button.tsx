'use client'

import { useState } from 'react'
import { ClipboardCopy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { getTemplates } from '@/app/actions/templates'
import { getStudent } from '@/app/actions/students'
import { buildLessonReport, DEFAULT_LESSON_REPORT_TEMPLATE } from '@/lib/utils/lesson-report'
import type { MessageTemplate } from '@/lib/types/database'

type Props = {
  readonly studentId: string
  readonly studentName: string
  readonly lessonDate: Date
  readonly content: string
  readonly homework: string
  readonly nextGoal: string
}

export function LessonReportButton({
  studentId,
  studentName,
  lessonDate,
  content,
  homework,
  nextGoal,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [templates, setTemplates] = useState<readonly MessageTemplate[]>([])
  const [score, setScore] = useState<number | null>(null)

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen || loaded) return

    setLoading(true)
    const [templatesResult, student] = await Promise.all([
      getTemplates(),
      getStudent(studentId).catch(() => null),
    ])
    setTemplates(templatesResult.success ? templatesResult.data : [])
    setScore(student?.current_score ?? null)
    setLoaded(true)
    setLoading(false)
  }

  async function handleCopy(templateContent: string) {
    const report = buildLessonReport(templateContent, {
      studentName,
      lessonDate,
      content,
      homework,
      nextGoal,
      score,
    })

    try {
      await navigator.clipboard.writeText(report)
      toast.success('복사됨')
      setOpen(false)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" data-testid="lesson-report-btn">
          <ClipboardCopy className="size-4" />
          학부모 리포트 복사
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" data-testid="lesson-report-popover">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          템플릿 선택
        </p>
        <Separator className="my-2" />
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : templates.length === 0 ? (
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="ghost"
              className="justify-start"
              onClick={() => handleCopy(DEFAULT_LESSON_REPORT_TEMPLATE)}
              data-testid="lesson-report-template-default"
            >
              기본 리포트 템플릿
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {templates.map((template) => (
              <Button
                key={template.id}
                type="button"
                variant="ghost"
                className="justify-start"
                onClick={() => handleCopy(template.content)}
                data-testid="lesson-report-template-item"
              >
                {template.title}
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
