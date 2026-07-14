'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Copy, Wallet } from 'lucide-react'
import { getPaymentAlerts, type PaymentAlert } from '@/app/actions/enrollments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useScheduleSyncVersion } from '@/lib/hooks/use-schedule-sync'

function buildPaymentMessage({ student, enrollment, completedSessions }: PaymentAlert): string {
  return `[정산 안내] ${student.name_ko} 학생, 현재까지 ${completedSessions}/${enrollment.total_sessions}회 수업이 진행되어 정산을 안내드립니다. 확인 부탁드립니다.`
}

function PaymentAlertRow({ alert }: { readonly alert: PaymentAlert }) {
  const { enrollment, student, completedSessions } = alert
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildPaymentMessage(alert))
      setCopied(true)
      toast.success('안내 문구를 복사했습니다')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <div
      data-testid="payment-alert-item"
      className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3"
    >
      <Link href={`/students/${student.id}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{student.name_ko}</p>
        <p className="mt-0.5 text-xs font-medium tabular-nums text-amber-700">
          {completedSessions} / {enrollment.total_sessions}회 완료
        </p>
      </Link>
      <Button
        type="button"
        size="sm"
        onClick={handleCopy}
        data-testid="payment-alert-copy"
        className="h-9 shrink-0 gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        안내 복사
      </Button>
    </div>
  )
}

export function PaymentAlerts() {
  const [alerts, setAlerts] = useState<readonly PaymentAlert[]>([])
  const syncVersion = useScheduleSyncVersion()

  useEffect(() => {
    getPaymentAlerts().then((result) => {
      if (result.success) setAlerts(result.data)
    })
    // syncVersion: 완료 회차가 바뀌면 정산 임박 여부도 바뀌므로 재조회
  }, [syncVersion])

  if (alerts.length === 0) return null

  return (
    <Card className="glass-card rounded-2xl border-none bg-amber-50/60" data-testid="payment-alerts">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100">
            <Wallet className="size-3.5 text-amber-600" />
          </div>
          정산 임박 {alerts.length}명
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <PaymentAlertRow key={alert.enrollment.id} alert={alert} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
