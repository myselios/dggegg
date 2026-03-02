'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { IB_COURSE_STYLES } from '@/lib/constants/status-styles'
import { StudentDeleteDialog } from './student-delete-dialog'
import type { Student } from '@/lib/types/database'

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-cyan-500',
] as const

function getAvatarColor(name: string): string {
  const charSum = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[charSum % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name.slice(0, 1)
}

export function StudentCard({ student }: { readonly student: Student }) {
  const router = useRouter()
  const avatarColor = getAvatarColor(student.name_ko)
  const initials = getInitials(student.name_ko)
  const course = student.ib_course ? IB_COURSE_STYLES[student.ib_course] : null

  return (
    <div className="group/card relative">
      <Card
        className={cn(
          'glass-card border-none py-0 rounded-xl transition-all duration-200 cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/8',
        )}
        onClick={() => router.push(`/students/${student.id}`)}
      >
        <CardContent className="flex items-start gap-3 p-3.5">
          <Avatar className="mt-0.5 shrink-0">
            <AvatarFallback className={cn(avatarColor, 'text-white text-xs font-semibold')}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-sm">{student.name_ko}</span>
              {course && (
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 border px-2 py-0 text-[10px] font-semibold tracking-wide',
                    course.className,
                  )}
                >
                  {course.label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <GraduationCap className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs text-muted-foreground">{student.school}</span>
              {student.grade && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  ({student.grade})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete button — hover overlay */}
      <div
        className="absolute top-2 left-2 z-10 opacity-0 transition-opacity group-hover/card:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <StudentDeleteDialog
          studentId={student.id}
          studentName={student.name_ko}
          trigger={
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-3.5" />
            </button>
          }
        />
      </div>
    </div>
  )
}
