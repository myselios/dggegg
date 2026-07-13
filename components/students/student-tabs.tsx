'use client'

import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentProfile } from './student-profile'
import { ConsultationLogTab } from './consultation-log-tab'
import { LessonHistoryTab } from './lesson-history-tab'
import { ScoreTab } from './score-tab'
import { StudentMaterialsTab } from './student-materials-tab'
import { EnrollmentSection } from './enrollment-section'
import { STUDENT_STATUS } from '@/lib/constants/status-styles'
import { cn } from '@/lib/utils'
import type { Student } from '@/lib/types/database'

export function StudentTabs({ student }: { readonly student: Student }) {
  const statusConfig = STUDENT_STATUS[student.status as keyof typeof STUDENT_STATUS] ?? STUDENT_STATUS.active

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/students"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          학생 목록
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <User className="size-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight">{student.name_ko}</h2>
            <Badge
              variant="outline"
              className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', statusConfig.badge)}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">{student.school}</span>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="lessons">수업기록</TabsTrigger>
          <TabsTrigger value="scores">성적 추이</TabsTrigger>
          <TabsTrigger value="consultations">상담 로그</TabsTrigger>
          <TabsTrigger value="materials">자료</TabsTrigger>
          <TabsTrigger value="enrollment">수강권</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <StudentProfile student={student} />
        </TabsContent>
        <TabsContent value="lessons">
          <LessonHistoryTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="scores">
          <ScoreTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="consultations">
          <ConsultationLogTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="materials">
          <StudentMaterialsTab studentId={student.id} studentName={student.name_ko} />
        </TabsContent>
        <TabsContent value="enrollment">
          <EnrollmentSection studentId={student.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
