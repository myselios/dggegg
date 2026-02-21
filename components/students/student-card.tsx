'use client'

import { useRouter } from 'next/navigation'
import { useDraggable } from '@dnd-kit/core'
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: student.id,
    data: { student },
  })

  const avatarColor = getAvatarColor(student.name_ko)
  const initials = getInitials(student.name_ko)
  const course = student.ib_course ? IB_COURSE_STYLES[student.ib_course] : null

  return (
    <div
      ref={setNodeRef}
      className={cn('group/card relative', isDragging && 'opacity-30')}
    >
      <Card
        className={cn(
          'shadow-sm border-border/50 py-0 transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20',
        )}
      >
        <CardContent className="flex items-stretch gap-0 p-0">
          {/* LEFT: Click zone → navigate to detail */}
          <div
            className="flex flex-1 min-w-0 cursor-pointer items-start gap-3 p-3.5"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/students/${student.id}`)
            }}
          >
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
          </div>

          {/* RIGHT: Drag handle */}
          <div
            className="flex w-8 shrink-0 cursor-grab items-center justify-center border-l border-border/30 text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            {...listeners}
            {...attributes}
          >
            <svg width="6" height="14" viewBox="0 0 6 14" fill="currentColor">
              <circle cx="1.5" cy="1.5" r="1.5" />
              <circle cx="4.5" cy="1.5" r="1.5" />
              <circle cx="1.5" cy="7" r="1.5" />
              <circle cx="4.5" cy="7" r="1.5" />
              <circle cx="1.5" cy="12.5" r="1.5" />
              <circle cx="4.5" cy="12.5" r="1.5" />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Delete button — hover overlay */}
      <div
        className="absolute top-2 left-2 z-10 opacity-0 transition-opacity group-hover/card:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
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

/** Overlay version for DragOverlay (no hooks) */
export function StudentCardOverlay({ student }: { readonly student: Student }) {
  const avatarColor = getAvatarColor(student.name_ko)
  const initials = getInitials(student.name_ko)
  const course = student.ib_course ? IB_COURSE_STYLES[student.ib_course] : null

  return (
    <Card className="w-72 rotate-2 border-border py-0 shadow-lg">
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
          <span className="truncate text-xs text-muted-foreground">{student.school}</span>
        </div>
      </CardContent>
    </Card>
  )
}
