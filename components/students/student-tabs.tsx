'use client'

import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentProfile } from './student-profile'
import type { Student } from '@/lib/types/database'

export function StudentTabs({ student }: { readonly student: Student }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/students" className="text-muted-foreground hover:text-foreground">
          &larr; 학생 목록
        </Link>
        <h2 className="text-2xl font-bold">{student.name_ko}</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="lessons">수업기록</TabsTrigger>
          <TabsTrigger value="scores">성적 추이</TabsTrigger>
          <TabsTrigger value="consultations">상담 로그</TabsTrigger>
          <TabsTrigger value="materials">자료</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <StudentProfile student={student} />
        </TabsContent>
        <TabsContent value="lessons">
          <p className="text-muted-foreground">수업 기록이 여기에 표시됩니다.</p>
        </TabsContent>
        <TabsContent value="scores">
          <p className="text-muted-foreground">성적 추이가 여기에 표시됩니다.</p>
        </TabsContent>
        <TabsContent value="consultations">
          <p className="text-muted-foreground">상담 로그가 여기에 표시됩니다.</p>
        </TabsContent>
        <TabsContent value="materials">
          <p className="text-muted-foreground">자료가 여기에 표시됩니다.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
