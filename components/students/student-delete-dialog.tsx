'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteStudent } from '@/app/actions/students'
import { useStudents } from '@/lib/hooks/use-students'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type StudentDeleteDialogProps = {
  readonly studentId: string
  readonly studentName: string
  readonly redirectAfterDelete?: boolean
  readonly trigger?: React.ReactNode
}

export function StudentDeleteDialog({
  studentId,
  studentName,
  redirectAfterDelete = false,
  trigger,
}: StudentDeleteDialogProps) {
  const router = useRouter()
  const { mutate } = useStudents()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteStudent(studentId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`${studentName} 학생이 삭제되었습니다`)
      await mutate()
      if (redirectAfterDelete) {
        router.push('/students')
      }
    } catch {
      toast.error('학생 삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1.5 size-3.5" />
            삭제
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>학생 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{studentName}</strong> 학생을 정말 삭제하시겠습니까?
            수업 기록, 성적, 상담 기록 등 모든 관련 데이터가 함께 삭제되며 복구할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
