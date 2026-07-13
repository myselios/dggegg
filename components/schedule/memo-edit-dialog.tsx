'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteScheduleEvent, updateScheduleEvent } from '@/app/actions/schedule'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTime } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

export function MemoEditDialog({
  event,
  onClose,
  onMutated,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClose: () => void
  readonly onMutated: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(event.title ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const result = await updateScheduleEvent(event.id, { title: editTitle.trim() })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onMutated()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      const result = await deleteScheduleEvent(event.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (result.warning) {
        toast.warning(result.warning)
      }
      onMutated()
    } finally {
      setDeleting(false)
    }
  }

  function handleCancelEdit() {
    setEditTitle(event.title ?? '')
    setIsEditing(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl p-6 gap-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="inline-block size-3 rounded-sm bg-amber-500" />
            {isEditing ? '메모 수정' : (event.title ?? '메모')}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="메모 제목"
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editTitle.trim()) handleSave()
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1 font-bold"
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              <p>
                {format(new Date(event.start_at), 'M월 d일 (EEE)', { locale: ko })}
                {' '}
                {formatTime(event.start_at)} - {formatTime(event.end_at)}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                닫기
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-1 h-4 w-4" />
                수정
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
