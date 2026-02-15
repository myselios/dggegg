'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { Plus, User, GraduationCap } from 'lucide-react'
import { createStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

function RequiredMark() {
  return <span className="text-red-500 ml-0.5">*</span>
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  readonly icon: React.ComponentType<{ readonly className?: string }>
  readonly title: string
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4" />
      <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
    </div>
  )
}

export function StudentCreateDialog() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { mutate } = useSWRConfig()

  async function handleSubmit(formData: FormData) {
    if (submitting) return
    setSubmitting(true)

    try {
    const result = await createStudent({
      name_ko: formData.get('name_ko') as string,
      grade: (formData.get('grade') as string) || null,
      school: formData.get('school') as string,
      residence: (formData.get('residence') as string) || null,
      ib_course: (formData.get('ib_course') as 'Ab initio' | 'SL' | 'HL') || null,
      current_score: null,
      weakness_areas: null,
      contact_parent: (formData.get('contact_parent') as string) || null,
      color: null,
      memo: null,
    })
    if (!result.success) {
      alert(result.error)
      return
    }
    await mutate('students')
    setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          학생 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">새 학생 등록</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            학생 정보를 입력하세요. <RequiredMark /> 표시는 필수 항목입니다.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-5">
          {/* 기본 정보 섹션 */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={User} title="기본 정보" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name_ko" className="text-xs font-medium">
                이름 (한글)<RequiredMark />
              </Label>
              <Input
                id="name_ko"
                name="name_ko"
                placeholder="홍길동"
                required
                className="h-9"
              />
            </div>
          </div>

          <Separator />

          {/* 학교/거주지 섹션 */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={GraduationCap} title="학교 및 거주지" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="school" className="text-xs font-medium">
                  학교<RequiredMark />
                </Label>
                <Input
                  id="school"
                  name="school"
                  placeholder="학교명"
                  required
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="grade" className="text-xs font-medium">
                  학년
                </Label>
                <Input
                  id="grade"
                  name="grade"
                  placeholder="예: G11"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="residence" className="text-xs font-medium">
                거주지
              </Label>
              <Input
                id="residence"
                name="residence"
                placeholder="예: 서울 강남구"
                className="h-9"
              />
            </div>
          </div>

          <Separator />

          {/* 연락처 섹션 */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={User} title="연락처" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_parent" className="text-xs font-medium">
                학부모 연락처
              </Label>
              <Input
                id="contact_parent"
                name="contact_parent"
                placeholder="010-0000-0000"
                className="h-9"
              />
            </div>
          </div>

          <Separator />

          {/* IB 과정 섹션 */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={GraduationCap} title="IB 과정" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ib_course" className="text-xs font-medium">
                IB 과정
              </Label>
              <Select name="ib_course">
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="과정 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ab initio">Ab initio</SelectItem>
                  <SelectItem value="SL">SL (Standard Level)</SelectItem>
                  <SelectItem value="HL">HL (Higher Level)</SelectItem>
                  <SelectItem value="IGCSE">IGCSE</SelectItem>
                  <SelectItem value="MYP">MYP</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '등록 중...' : '등록하기'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
