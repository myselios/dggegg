'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ConsultationWithStudent = {
  readonly id: string
  readonly type: string
  readonly content: string
  readonly date: string
  readonly students: { readonly name_ko: string }
}

export function RecentConsultations() {
  const [logs, setLogs] = useState<ConsultationWithStudent[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('consultation_logs')
      .select('id, type, content, date, students(name_ko)')
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setLogs(data as unknown as ConsultationWithStudent[])
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 상담</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">상담 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{log.students.name_ko}</span>
                  <Badge variant="outline" className="text-xs">{log.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.date), 'M/d', { locale: ko })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{log.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
