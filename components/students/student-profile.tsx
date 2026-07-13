'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Phone } from 'lucide-react'
import { updateStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StudentDeleteDialog } from './student-delete-dialog'
import { STUDENT_STATUS } from '@/lib/constants/status-styles'
import { cn } from '@/lib/utils'
import type { Student } from '@/lib/types/database'

export function StudentProfile({ student }: { readonly student: Student }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  async function handleUpdate(formData: FormData) {
    const weaknessRaw = formData.get('weakness_areas') as string
    const result = await updateStudent(student.id, {
      name_ko: formData.get('name_ko') as string,
      grade: (formData.get('grade') as string) || null,
      school: formData.get('school') as string,
      residence: (formData.get('residence') as string) || null,
      ib_course: (formData.get('ib_course') as Student['ib_course']) || null,
      current_score: Number(formData.get('current_score')) || null,
      weakness_areas: weaknessRaw ? weaknessRaw.split(',').map((t) => t.trim()).filter(Boolean) : null,
      contact_parent: (formData.get('contact_parent') as string) || null,
      status: formData.get('status') as Student['status'],
      memo: (formData.get('memo') as string) || null,
    })
    if (!result.success) {
      alert(result.error)
      return
    }
    setIsEditing(false)
    router.refresh()
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card border-none rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="size-3.5 text-primary" />
                  </div>
                  기본 정보
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  수정
                </Button>
              </CardTitle>
            </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="이름 (한글)" value={student.name_ko} />
            <InfoRow label="학교" value={student.school} />
            <InfoRow label="학년" value={student.grade} />
            <InfoRow label="거주지" value={student.residence} />
            <InfoRow label="IB 과정" value={student.ib_course} />
            <StatusRow status={student.status} />
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              성적 / 연락처
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="현재 점수" value={student.current_score?.toString()} />
            <InfoRow label="학부모 연락처" value={student.contact_parent} />
            <WeaknessAreasRow areas={student.weakness_areas} />
            {student.memo && <InfoRow label="메모" value={student.memo} />}
          </CardContent>
        </Card>
        </div>
        <div className="flex justify-end">
          <StudentDeleteDialog
            studentId={student.id}
            studentName={student.name_ko}
            redirectAfterDelete
          />
        </div>
      </div>
    )
  }

  return (
    <form action={handleUpdate}>
      <Card className="glass-card border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            프로필 수정
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button size="sm" type="submit">저장</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="이름 (한글)" name="name_ko" defaultValue={student.name_ko} required />
          <Field label="학교" name="school" defaultValue={student.school} required />
          <Field label="학년" name="grade" defaultValue={student.grade ?? ''} />
          <Field label="거주지" name="residence" defaultValue={student.residence ?? ''} />
          <Field label="학부모 연락처" name="contact_parent" defaultValue={student.contact_parent ?? ''} />
          <div className="flex flex-col gap-2">
            <Label>IB 과정</Label>
            <Select name="ib_course" defaultValue={student.ib_course ?? undefined}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ab initio">Ab initio</SelectItem>
                <SelectItem value="SL">SL</SelectItem>
                <SelectItem value="HL">HL</SelectItem>
                <SelectItem value="IGCSE">IGCSE</SelectItem>
                <SelectItem value="MYP">MYP</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="현재 점수" name="current_score" type="number" defaultValue={student.current_score?.toString() ?? ''} />
          <div className="flex flex-col gap-2">
            <Label>상태</Label>
            <Select name="status" defaultValue={student.status}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {Object.entries(STUDENT_STATUS).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>취약 영역 (콤마 구분)</Label>
            <Input
              name="weakness_areas"
              placeholder="함수, 미적분"
              defaultValue={student.weakness_areas?.join(', ') ?? ''}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>메모</Label>
            <Textarea name="memo" defaultValue={student.memo ?? ''} />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '-'}</span>
    </div>
  )
}

function StatusRow({ status }: { readonly status: Student['status'] }) {
  const config = STUDENT_STATUS[status] ?? STUDENT_STATUS.active
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">상태</span>
      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.badge)}>
        {config.label}
      </Badge>
    </div>
  )
}

function WeaknessAreasRow({ areas }: { readonly areas: string[] | null }) {
  if (!areas || areas.length === 0) {
    return <InfoRow label="취약 영역" value={null} />
  }
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">취약 영역</span>
      <div className="flex flex-wrap justify-end gap-1">
        {areas.map((area) => (
          <Badge key={area} variant="outline" className="text-[10px] px-1.5 py-0">{area}</Badge>
        ))}
      </div>
    </div>
  )
}

function Field({
  label, name, defaultValue = '', type = 'text', required = false,
}: {
  readonly label: string
  readonly name: string
  readonly defaultValue?: string
  readonly type?: string
  readonly required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  )
}
