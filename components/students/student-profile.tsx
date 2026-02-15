'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentDeleteDialog } from './student-delete-dialog'
import type { Student } from '@/lib/types/database'

export function StudentProfile({ student }: { readonly student: Student }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  async function handleUpdate(formData: FormData) {
    const result = await updateStudent(student.id, {
      name_ko: formData.get('name_ko') as string,
      name_en: (formData.get('name_en') as string) || null,
      grade: (formData.get('grade') as string) || null,
      school: formData.get('school') as string,
      residence: (formData.get('residence') as string) || null,
      kakao_id: (formData.get('kakao_id') as string) || null,
      zoom_url: (formData.get('zoom_url') as string) || null,
      ib_course: (formData.get('ib_course') as Student['ib_course']) || null,
      exam_date: (formData.get('exam_date') as string) || null,
      target_score: Number(formData.get('target_score')) || null,
      current_score: Number(formData.get('current_score')) || null,
      contact_student: (formData.get('contact_student') as string) || null,
      contact_parent: (formData.get('contact_parent') as string) || null,
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                기본 정보
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  수정
                </Button>
              </CardTitle>
            </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="이름 (한글)" value={student.name_ko} />
            <InfoRow label="이름 (영문)" value={student.name_en} />
            <InfoRow label="학교" value={student.school} />
            <InfoRow label="학년" value={student.grade} />
            <InfoRow label="거주지" value={student.residence} />
            <InfoRow label="IB 과정" value={student.ib_course} />
            <InfoRow label="시험 예정일" value={student.exam_date} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>성적 / 연락처</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="목표 점수" value={student.target_score?.toString()} />
            <InfoRow label="현재 점수" value={student.current_score?.toString()} />
            <InfoRow label="학생 연락처" value={student.contact_student} />
            <InfoRow label="학부모 연락처" value={student.contact_parent} />
            <InfoRow label="카카오톡 ID" value={student.kakao_id} />
            <InfoRow label="Zoom URL" value={student.zoom_url} />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
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
          <Field label="이름 (영문)" name="name_en" defaultValue={student.name_en ?? ''} />
          <Field label="학교" name="school" defaultValue={student.school} required />
          <Field label="학년" name="grade" defaultValue={student.grade ?? ''} />
          <Field label="거주지" name="residence" defaultValue={student.residence ?? ''} />
          <Field label="카카오톡 ID" name="kakao_id" defaultValue={student.kakao_id ?? ''} />
          <Field label="Zoom URL" name="zoom_url" defaultValue={student.zoom_url ?? ''} />
          <Field label="학생 연락처" name="contact_student" defaultValue={student.contact_student ?? ''} />
          <Field label="학부모 연락처" name="contact_parent" defaultValue={student.contact_parent ?? ''} />
          <div className="flex flex-col gap-2">
            <Label>IB 과정</Label>
            <Select name="ib_course" defaultValue={student.ib_course ?? undefined}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ab initio">Ab initio</SelectItem>
                <SelectItem value="SL">SL</SelectItem>
                <SelectItem value="HL">HL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="시험 예정일" name="exam_date" type="date" defaultValue={student.exam_date ?? ''} />
          <Field label="목표 점수" name="target_score" type="number" defaultValue={student.target_score?.toString() ?? ''} />
          <Field label="현재 점수" name="current_score" type="number" defaultValue={student.current_score?.toString() ?? ''} />
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? '-'}</span>
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
