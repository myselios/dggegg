'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MessageTemplate, MessageTemplateInsert, TemplateCategory } from '@/lib/types/database'

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  first_consult: '첫 상담 후',
  after_lesson: '수업 종료 후',
  re_enrollment: '재등록 안내',
  other: '기타',
}

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: MessageTemplateInsert) => Promise<void>
  defaultCategory?: TemplateCategory
  template?: MessageTemplate
}

export function TemplateDialog({ open, onClose, onSave, defaultCategory = 'first_consult', template }: Props) {
  const [category, setCategory] = useState<TemplateCategory>(defaultCategory)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory(template?.category ?? defaultCategory)
      setTitle(template?.title ?? '')
      setContent(template?.content ?? '')
      setSaving(false)
    }
  }, [open, template, defaultCategory])

  const isValid = title.trim().length > 0 && content.trim().length > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    try {
      await onSave({ category, title: title.trim(), content: content.trim() })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{template ? '템플릿 수정' : '새 템플릿'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">카테고리</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
              <SelectTrigger id="category" data-testid="template-category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [TemplateCategory, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              data-testid="template-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="템플릿 제목을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              data-testid="template-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="학부모에게 보낼 메시지 내용을 입력하세요"
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>취소</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            data-testid="template-save-btn"
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
