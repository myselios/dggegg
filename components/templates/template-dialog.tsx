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
import type { MessageTemplate, MessageTemplateInsert } from '@/lib/types/database'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: MessageTemplateInsert) => Promise<void>
  template?: MessageTemplate
}

export function TemplateDialog({ open, onClose, onSave, template }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(template?.title ?? '')
      setContent(template?.content ?? '')
      setSaving(false)
    }
  }, [open, template])

  const isValid = title.trim().length > 0 && content.trim().length > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    try {
      await onSave({ category: 'other', title: title.trim(), content: content.trim() })
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
              rows={8}
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
