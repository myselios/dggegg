'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { deleteScheduleEvent } from '@/app/actions/schedule'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils/date'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

export function MemoEditDialog({
  event,
  onClose,
  onDeleted,
}: {
  readonly event: ScheduleEventWithStudent
  readonly onClose: () => void
  readonly onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      const result = await deleteScheduleEvent(event.id)
      if (!result.success) {
        alert(result.error)
        return
      }
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-500" />
            {event.title ?? '메모'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
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
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {deleting ? '삭제 중...' : '메모 삭제'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
