'use client'

import { useState, useCallback } from 'react'
import { Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { saveStudentDocsUrl, deleteStudentDocsUrl } from '@/app/actions/student-materials'
import { StudentProgressCard } from './student-progress-card'
import type { Student, StudentDoc } from '@/lib/types/database'

type Props = {
  readonly students: Student[]
}

type DocsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly doc: StudentDoc | null }

export function StudentDocsSection({ students }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [docsState, setDocsState] = useState<DocsState>({ status: 'idle' })
  const [urlInput, setUrlInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const activeStudents = students.filter((s) => s.status === 'active')

  const fetchStudentDoc = useCallback(async (studentId: string) => {
    setDocsState({ status: 'loading' })
    const supabase = createClient()
    const { data } = await supabase
      .from('student_docs')
      .select('*')
      .eq('student_id', studentId)
      .single()

    const doc = data as StudentDoc | null
    setDocsState({ status: 'loaded', doc })
    setUrlInput(doc?.docs_url ?? '')
  }, [])

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId)
    fetchStudentDoc(studentId)
  }

  const handleSave = async () => {
    if (!selectedStudentId || !urlInput.trim()) return

    setIsSaving(true)
    const result = await saveStudentDocsUrl(selectedStudentId, urlInput.trim())
    setIsSaving(false)

    if (result.success) {
      toast.success('Google Docs가 연결되었습니다')
      fetchStudentDoc(selectedStudentId)
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!selectedStudentId) return

    setIsDeleting(true)
    const result = await deleteStudentDocsUrl(selectedStudentId)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Google Docs 연결이 해제되었습니다')
      setUrlInput('')
      setDocsState({ status: 'loaded', doc: null })
    } else {
      toast.error(result.error)
    }
  }

  const selectedStudent = activeStudents.find((s) => s.id === selectedStudentId) ?? null
  const registeredDoc = docsState.status === 'loaded' ? docsState.doc : null
  const hasDoc = registeredDoc !== null
  const isActionDisabled = isSaving || isDeleting || docsState.status === 'loading'

  return (
    <div className="space-y-6">
      <DocsUrlManager
        activeStudents={activeStudents}
        selectedStudentId={selectedStudentId}
        urlInput={urlInput}
        hasDoc={hasDoc}
        isActionDisabled={isActionDisabled}
        isSaving={isSaving}
        isDeleting={isDeleting}
        docsLoading={docsState.status === 'loading'}
        onStudentSelect={handleStudentSelect}
        onUrlChange={setUrlInput}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {selectedStudent !== null && (
        <>
          <Separator />
          {hasDoc ? (
            <StudentProgressCard
              studentId={selectedStudent.id}
              studentName={selectedStudent.name_ko}
            />
          ) : (
            <EmptyDocsHint />
          )}
        </>
      )}
    </div>
  )
}

type DocsUrlManagerProps = {
  readonly activeStudents: Student[]
  readonly selectedStudentId: string | null
  readonly urlInput: string
  readonly hasDoc: boolean
  readonly isActionDisabled: boolean
  readonly isSaving: boolean
  readonly isDeleting: boolean
  readonly docsLoading: boolean
  readonly onStudentSelect: (id: string) => void
  readonly onUrlChange: (url: string) => void
  readonly onSave: () => void
  readonly onDelete: () => void
}

function DocsUrlManager({
  activeStudents,
  selectedStudentId,
  urlInput,
  hasDoc,
  isActionDisabled,
  isSaving,
  isDeleting,
  docsLoading,
  onStudentSelect,
  onUrlChange,
  onSave,
  onDelete,
}: DocsUrlManagerProps) {
  return (
    <div className="glass-card flex flex-col gap-5 rounded-2xl p-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-foreground">학생 선택</Label>
        <Select value={selectedStudentId ?? ''} onValueChange={onStudentSelect}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="학생을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {activeStudents.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name_ko}
                {student.grade ? ` (${student.grade})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudentId !== null && (
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">Google Docs URL</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={urlInput}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://docs.google.com/document/d/..."
              disabled={isActionDisabled}
              className="h-11 flex-1"
            />
            <div className="flex gap-2">
              <Button
                onClick={onSave}
                disabled={isActionDisabled || !urlInput.trim()}
                className="h-11 shrink-0 gap-1.5"
              >
                <Link2 className="size-3.5" />
                {docsLoading ? '조회 중...' : isSaving ? '저장 중...' : hasDoc ? '수정' : '연결'}
              </Button>
              {hasDoc && (
                <Button
                  onClick={onDelete}
                  disabled={isActionDisabled}
                  variant="outline"
                  className="h-11 shrink-0 gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="size-3.5" />
                  {isDeleting ? '삭제 중...' : '삭제'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyDocsHint() {
  return (
    <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
      Google Docs를 연결하면 AI 진도현황을 확인할 수 있습니다.
    </div>
  )
}
