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

type ConsultationWithStudent = {
  readonly id: string
  readonly type: string
  readonly content: string
  readonly date: string
  readonly students: { readonly name_ko: string }
}

const TYPE_CONFIG = {
  consultation: {
    label: '상담',
    icon: MessageSquare,
    badgeClass: 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  complaint: {
    label: '불만',
    icon: AlertCircle,
    badgeClass: 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  request: {
    label: '요청',
    icon: HelpCircle,
    badgeClass: 'border-violet-200 text-violet-700 bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:bg-violet-950',
    iconBg: 'bg-violet-100 dark:bg-violet-900',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  notice: {
    label: '공지',
    icon: Bell,
    badgeClass: 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
} as const

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.consultation
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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessagesSquare className="h-6 w-6 text-muted-foreground/50" />
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
              const config = getTypeConfig(log.type)
              const Icon = config.icon

              return (
                <div
                  key={log.id}
                  className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  {/* Type Icon */}
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    config.iconBg
                  )}>
                    <Icon className={cn('h-4 w-4', config.iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {log.students.name_ko}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 gap-1', config.badgeClass)}
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
