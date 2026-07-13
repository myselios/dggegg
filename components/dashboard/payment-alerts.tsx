'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { getPaymentAlerts, type PaymentAlert } from '@/app/actions/enrollments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PaymentAlerts() {
  const [alerts, setAlerts] = useState<readonly PaymentAlert[]>([])

  useEffect(() => {
    getPaymentAlerts().then((result) => {
      if (result.success) setAlerts(result.data)
    })
  }, [])

  if (alerts.length === 0) return null

  return (
    <Card className="glass-card rounded-2xl border-none" data-testid="payment-alerts">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100">
            <Wallet className="size-3.5 text-amber-600" />
          </div>
          정산 임박 {alerts.length}명
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {alerts.map(({ enrollment, student, completedSessions }) => (
            <Link
              key={enrollment.id}
              href={`/students/${student.id}`}
              className="flex items-center justify-between rounded-lg border border-border/40 p-2.5 text-sm transition-colors hover:bg-accent/50"
              data-testid="payment-alert-item"
            >
              <span className="font-medium">{student.name_ko}</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50"
              >
                {completedSessions} / {enrollment.total_sessions}회
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
