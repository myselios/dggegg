'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { createStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function StudentCreateDialog() {
  const [open, setOpen] = useState(false)
  const { mutate } = useSWRConfig()

  async function handleSubmit(formData: FormData) {
    await createStudent({
      name_ko: formData.get('name_ko') as string,
      name_en: (formData.get('name_en') as string) || null,
      grade: (formData.get('grade') as string) || null,
      school: formData.get('school') as string,
      ib_course: (formData.get('ib_course') as 'Ab initio' | 'SL' | 'HL') || null,
      exam_date: (formData.get('exam_date') as string) || null,
      target_score: null,
      current_score: null,
      weakness_areas: null,
      contact_student: (formData.get('contact_student') as string) || null,
      contact_parent: (formData.get('contact_parent') as string) || null,
      color: null,
      memo: null,
    })
    await mutate('students')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>학생 추가</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 학생 등록</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name_ko">이름 (한글) *</Label>
              <Input id="name_ko" name="name_ko" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name_en">이름 (영문)</Label>
              <Input id="name_en" name="name_en" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="school">학교 *</Label>
              <Input id="school" name="school" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade">학년</Label>
              <Input id="grade" name="grade" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ib_course">IB 과정</Label>
              <Select name="ib_course">
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ab initio">Ab initio</SelectItem>
                  <SelectItem value="SL">SL</SelectItem>
                  <SelectItem value="HL">HL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="exam_date">시험 예정일</Label>
              <Input id="exam_date" name="exam_date" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_student">학생 연락처</Label>
              <Input id="contact_student" name="contact_student" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_parent">학부모 연락처</Label>
              <Input id="contact_parent" name="contact_parent" />
            </div>
          </div>
          <Button type="submit" className="w-full">등록</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
