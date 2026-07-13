'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Bell,
  MessagesSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getConsultationType } from '@/lib/constants/status-styles'

const TYPE_ICONS = {
  consultation: MessageSquare,
  complaint: AlertCircle,
  request: HelpCircle,
  notice: Bell,
} as const

const TYPE_DOT = {
  consultation: 'bg-blue-500',
  complaint: 'bg-red-500',
  request: 'bg-violet-500',
  notice: 'bg-amber-500',
} as const

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
    <Card className="glass-card rounded-2xl border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
            <MessagesSquare className="size-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          최근 상담
          {logs.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs font-normal">
              {logs.length}건
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <MessagesSquare className="size-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              상담 기록이 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              상담 내용을 기록하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => {
              const config = getConsultationType(log.type)
              const Icon = TYPE_ICONS[log.type as keyof typeof TYPE_ICONS] ?? MessageSquare

              return (
                <div
                  key={log.id}
                  className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    config.iconBg
                  )}>
                    <Icon className={cn('size-4', config.iconColor)} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">
                        {log.students.name_ko}
                      </span>
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          TYPE_DOT[log.type as keyof typeof TYPE_DOT] ?? TYPE_DOT.consultation
                        )}
                      />
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 gap-1', config.badge)}
                      >
                        {config.label}
                      </Badge>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                        {format(new Date(log.date), 'M/d (EEE)', { locale: ko })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {log.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
