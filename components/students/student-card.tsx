'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Student } from '@/lib/types/database'

const courseColors: Record<string, string> = {
  'Ab initio': 'bg-green-100 text-green-800',
  'SL': 'bg-blue-100 text-blue-800',
  'HL': 'bg-purple-100 text-purple-800',
}

export function StudentCard({ student }: { readonly student: Student }) {
  return (
    <Link href={`/students/${student.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{student.name_ko}</span>
            {student.ib_course && (
              <Badge variant="secondary" className={courseColors[student.ib_course] ?? ''}>
                {student.ib_course}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{student.school}</span>
          {student.name_en && (
            <span className="text-xs text-muted-foreground">{student.name_en}</span>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
