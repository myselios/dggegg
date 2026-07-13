'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MessageSquare, Plus, Search, Trash2 } from 'lucide-react'
import { getConsultationLogs, createConsultationLog, deleteConsultationLog } from '@/app/actions/consultations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getConsultationType, CONSULTATION_TYPE } from '@/lib/constants/status-styles'
import { cn } from '@/lib/utils'
import type { ConsultationLog } from '@/lib/types/database'

const LOG_TYPES = Object.entries(CONSULTATION_TYPE).map(([value, config]) => ({
  value,
  label: config.label,
})) as readonly { readonly value: string; readonly label: string }[]

export function ConsultationLogTab({ studentId }: { readonly studentId: string }) {
  const [logs, setLogs] = useState<ConsultationLog[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getConsultationLogs(studentId).then(setLogs)
  }, [studentId])

  const filtered = logs.filter((log) =>
    log.content.toLowerCase().includes(search.toLowerCase()) ||
    log.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSubmit(formData: FormData) {
    const tagsRaw = formData.get('tags') as string
    const result = await createConsultationLog({
      student_id: studentId,
      event_id: null,
      type: formData.get('type') as ConsultationLog['type'],
      content: formData.get('content') as string,
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()) : null,
      date: new Date().toISOString(),
    })
    if (!result.success) {
      alert(result.error)
      return
    }
    const updated = await getConsultationLogs(studentId)
    setLogs(updated)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    const result = await deleteConsultationLog(id)
    if (!result.success) {
      alert(result.error)
      return
    }
    setLogs(logs.filter((l) => l.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            placeholder="검색 (키워드/태그)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '취소' : <><Plus className="mr-1 size-4" />상담 추가</>}
        </Button>
      </div>

      {showForm && (
        <Card className="glass-card border-none rounded-xl">
          <CardContent className="p-4">
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>유형 *</Label>
                  <Select name="type" required>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {LOG_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>태그 (콤마 구분)</Label>
                  <Input name="tags" placeholder="숙제불만, 점수문의" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>내용 *</Label>
                <Textarea name="content" rows={4} required placeholder="상담 내용..." />
              </div>
              <Button type="submit" size="sm">저장</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((log) => {
          const typeConfig = getConsultationType(log.type)
          return (
            <Card key={log.id} className="glass-card border-none rounded-xl">
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', typeConfig.badge)}
                    >
                      {typeConfig.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.date), 'M월 d일 HH:mm', { locale: ko })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{log.content}</p>
                  {log.tags && log.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {log.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">상담 로그가 없습니다</p>
            <p className="mt-1 text-xs text-muted-foreground/60">상담 기록을 추가해보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
