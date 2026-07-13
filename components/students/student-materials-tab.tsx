'use client'

import { useEffect, useState } from 'react'
import { Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { saveStudentDocsUrl, deleteStudentDocsUrl } from '@/app/actions/student-materials'
import { StudentProgressCard } from '@/components/materials/student-progress-card'
import type { StudentDoc } from '@/lib/types/database'

type Props = {
  readonly studentId: string
  readonly studentName: string
}

type DocsState =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly doc: StudentDoc | null }

export function StudentMaterialsTab({ studentId, studentName }: Props) {
  const [docsState, setDocsState] = useState<DocsState>({ status: 'loading' })
  const [urlInput, setUrlInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('student_docs')
      .select('*')
      .eq('student_id', studentId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        const doc = data as StudentDoc | null
        setDocsState({ status: 'loaded', doc })
        setUrlInput(doc?.docs_url ?? '')
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  const refetchStudentDoc = () => {
    setDocsState({ status: 'loading' })
    const supabase = createClient()
    supabase
      .from('student_docs')
      .select('*')
      .eq('student_id', studentId)
      .single()
      .then(({ data }) => {
        const doc = data as StudentDoc | null
        setDocsState({ status: 'loaded', doc })
        setUrlInput(doc?.docs_url ?? '')
      })
  }

  const handleSave = async () => {
    if (!urlInput.trim()) return

    setIsSaving(true)
    const result = await saveStudentDocsUrl(studentId, urlInput.trim())
    setIsSaving(false)

    if (result.success) {
      toast.success('Google Docs가 연결되었습니다')
      refetchStudentDoc()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteStudentDocsUrl(studentId)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Google Docs 연결이 해제되었습니다')
      setUrlInput('')
      setDocsState({ status: 'loaded', doc: null })
    } else {
      toast.error(result.error)
    }
  }

  const hasDoc = docsState.status === 'loaded' && docsState.doc !== null
  const isActionDisabled = isSaving || isDeleting || docsState.status === 'loading'

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Google Docs URL</Label>
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://docs.google.com/document/d/..."
            disabled={isActionDisabled}
            className="flex-1"
          />
          <Button
            onClick={handleSave}
            disabled={isActionDisabled || !urlInput.trim()}
            size="sm"
            className="shrink-0 gap-1.5"
          >
            <Link2 className="size-3.5" />
            {docsState.status === 'loading' ? '조회 중...' : isSaving ? '저장 중...' : hasDoc ? '수정' : '연결'}
          </Button>
          {hasDoc && (
            <Button
              onClick={handleDelete}
              disabled={isActionDisabled}
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {hasDoc ? (
        <StudentProgressCard studentId={studentId} studentName={studentName} />
      ) : (
        <div className="glass-card rounded-xl p-4 text-center text-sm text-muted-foreground">
          Google Docs를 연결하면 AI 진도현황을 확인할 수 있습니다.
        </div>
      )}
    </div>
  )
}
