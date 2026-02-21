'use client'

import { useState, useCallback, useRef } from 'react'
import { useSWRConfig } from 'swr'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { createStudentsBatch } from '@/app/actions/students'
import { useStudents } from '@/lib/hooks/use-students'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StudentInsert } from '@/lib/types/database'

type CsvRow = {
  readonly name_ko: string
  readonly school: string
  readonly residence: string | null
  readonly grade: string | null
}

type ParsedRow = CsvRow & {
  readonly isDuplicate: boolean
  readonly rowNumber: number
}

type ParseResult = {
  readonly rows: readonly ParsedRow[]
  readonly errors: readonly string[]
}

const HEADER_ALIASES: Record<string, keyof CsvRow> = {
  '이름': 'name_ko',
  'name': 'name_ko',
  'name_ko': 'name_ko',
  '학교': 'school',
  'school': 'school',
  '거주지': 'residence',
  'residence': 'residence',
  '학년': 'grade',
  'grade': 'grade',
}

const SAMPLE_CSV = `이름,학교,거주지,학년
홍길동,한국국제학교,서울,G10
김민수,제주국제학교,제주,G11
이지은,채드윅 송도,인천,G9`

function downloadSampleCsv() {
  const bom = '\uFEFF'
  const blob = new Blob([bom + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'students_sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(
  text: string,
  existingStudents: readonly { name_ko: string; school: string }[],
): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV 파일에 헤더와 최소 1행의 데이터가 필요합니다'] }
  }

  const headerFields = parseCsvLine(lines[0])
  const columnMap = new Map<number, keyof CsvRow>()

  for (let i = 0; i < headerFields.length; i++) {
    const normalized = headerFields[i].toLowerCase().trim()
    const mapped = HEADER_ALIASES[normalized]
    if (mapped) {
      columnMap.set(i, mapped)
    }
  }

  if (!Array.from(columnMap.values()).includes('name_ko')) {
    return { rows: [], errors: ['이름(name) 컬럼을 찾을 수 없습니다'] }
  }
  if (!Array.from(columnMap.values()).includes('school')) {
    return { rows: [], errors: ['학교(school) 컬럼을 찾을 수 없습니다'] }
  }

  const existingSet = new Set(
    existingStudents.map((s) => `${s.name_ko}::${s.school}`)
  )

  const rows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    const row: Record<string, string | null> = {
      name_ko: '',
      school: '',
      residence: null,
      grade: null,
    }

    for (const [colIdx, fieldName] of columnMap.entries()) {
      const value = fields[colIdx]?.trim() ?? ''
      row[fieldName] = value || null
    }

    if (!row.name_ko) {
      errors.push(`${i + 1}행: 이름이 비어있습니다`)
      continue
    }
    if (!row.school) {
      errors.push(`${i + 1}행: 학교가 비어있습니다`)
      continue
    }

    const isDuplicate = existingSet.has(`${row.name_ko}::${row.school}`)

    rows.push({
      name_ko: row.name_ko as string,
      school: row.school as string,
      residence: row.residence,
      grade: row.grade,
      isDuplicate,
      rowNumber: i + 1,
    })
  }

  return { rows, errors }
}

export function StudentCsvImportDialog() {
  const [open, setOpen] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: students } = useStudents()
  const { mutate } = useSWRConfig()

  const existingStudents = (students ?? []).map((s) => ({
    name_ko: s.name_ko,
    school: s.school,
  }))

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv')) {
        toast.error('CSV 파일만 지원합니다')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = parseCsv(text, existingStudents)
        setParseResult(result)
      }
      reader.readAsText(file, 'UTF-8')
    },
    [existingStudents],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const newRows = parseResult?.rows.filter((r) => !r.isDuplicate) ?? []
  const duplicateRows = parseResult?.rows.filter((r) => r.isDuplicate) ?? []

  async function handleSubmit() {
    if (submitting || newRows.length === 0) return
    setSubmitting(true)

    try {
      const inputs: StudentInsert[] = newRows.map((row) => ({
        name_ko: row.name_ko,
        school: row.school,
        residence: row.residence,
        grade: row.grade,
        ib_course: null,
        current_score: null,
        weakness_areas: null,
        contact_parent: null,
        color: null,
        memo: null,
      }))

      const result = await createStudentsBatch(inputs)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`${result.data.created}명의 학생이 추가되었습니다`)
      await mutate('students')
      setOpen(false)
      setParseResult(null)
    } catch {
      toast.error('학생 일괄 등록 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setParseResult(null)
      setIsDragOver(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="size-4" />
          CSV 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">CSV 파일로 학생 일괄 추가</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            CSV 파일을 업로드하여 여러 학생을 한번에 추가합니다.
          </DialogDescription>
        </DialogHeader>

        {!parseResult ? (
          <div className="flex flex-col gap-4">
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 hover:border-border',
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="size-10 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm font-medium">CSV 파일을 선택하거나 드래그하세요</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  필수 컬럼: 이름, 학교 / 선택: 거주지, 학년
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 self-start text-xs text-muted-foreground"
              onClick={downloadSampleCsv}
            >
              <Download className="size-3.5" />
              샘플 CSV 다운로드
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {parseResult.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-4" />
                  파싱 오류 ({parseResult.errors.length}건)
                </div>
                <ul className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-400">
                  {parseResult.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {parseResult.rows.length > 0 && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="size-3" />
                    추가 {newRows.length}건
                  </Badge>
                  {duplicateRows.length > 0 && (
                    <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <AlertTriangle className="size-3" />
                      중복 건너뛰기 {duplicateRows.length}건
                    </Badge>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium w-10"></th>
                        <th className="px-3 py-2 text-left font-medium">이름</th>
                        <th className="px-3 py-2 text-left font-medium">학교</th>
                        <th className="px-3 py-2 text-left font-medium">거주지</th>
                        <th className="px-3 py-2 text-left font-medium">학년</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.map((row) => (
                        <tr
                          key={`${row.rowNumber}-${row.name_ko}`}
                          className={cn(
                            'border-b last:border-0',
                            row.isDuplicate && 'bg-amber-50/50 text-muted-foreground dark:bg-amber-950/30',
                          )}
                        >
                          <td className="px-3 py-2 text-center">
                            {row.isDuplicate ? (
                              <AlertTriangle className="inline size-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="inline size-4 text-emerald-500" />
                            )}
                          </td>
                          <td className="px-3 py-2">{row.name_ko}</td>
                          <td className="px-3 py-2">{row.school}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.residence ?? '-'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.grade ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParseResult(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                다시 선택
              </Button>
              <Button
                size="sm"
                disabled={newRows.length === 0 || submitting}
                onClick={handleSubmit}
              >
                {submitting ? '추가 중...' : `${newRows.length}명 추가하기`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
