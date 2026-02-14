'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getConsultationLogs, createConsultationLog, deleteConsultationLog } from '@/app/actions/consultations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ConsultationLog } from '@/lib/types/database'

const LOG_TYPES = [
  { value: 'consultation', label: '상담', color: 'bg-blue-100 text-blue-800' },
  { value: 'complaint', label: '컴플레인', color: 'bg-red-100 text-red-800' },
  { value: 'request', label: '요청', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'notice', label: '공지', color: 'bg-green-100 text-green-800' },
] as const

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
      <div className="flex items-center gap-4">
        <Input
          placeholder="검색 (키워드/태그)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '취소' : '상담 추가'}
        </Button>
      </div>

      {showForm && (
        <Card>
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
          const typeInfo = LOG_TYPES.find((t) => t.value === log.type)
          return (
            <Card key={log.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={typeInfo?.color}>
                      {typeInfo?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.date), 'M월 d일 HH:mm', { locale: ko })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{log.content}</p>
                  {log.tags && log.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {log.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => handleDelete(log.id)}
                >
                  삭제
                </Button>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">상담 로그가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
