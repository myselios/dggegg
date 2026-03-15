'use client'

import { useState } from 'react'
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

type Props = {
  readonly open: boolean
  readonly title: string
  readonly initialUrl?: string
  readonly initialLabel?: string
  readonly onClose: () => void
  readonly onSave: (url: string, label: string) => Promise<void>
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function LinkDialog({ open, title, initialUrl = '', initialLabel = '', onClose, onSave }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [label, setLabel] = useState(initialLabel)
  const [saving, setSaving] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setUrl(initialUrl)
      setLabel(initialLabel)
      onClose()
    }
  }

  const handleSave = async () => {
    if (!isValidUrl(url)) return
    setSaving(true)
    try {
      await onSave(url.trim(), label.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="link-url">URL <span className="text-destructive">*</span></Label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://forms.gle/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="link-label">라벨 <span className="text-xs text-muted-foreground">(선택)</span></Label>
            <Input
              id="link-label"
              placeholder="예) 1회차 단어 테스트"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>취소</Button>
          <Button onClick={handleSave} disabled={!isValidUrl(url) || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
