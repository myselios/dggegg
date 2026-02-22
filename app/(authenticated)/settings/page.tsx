'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Settings, Link2, Unlink2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  checkGoogleConnection,
  getGoogleAuthUrl,
  disconnectGoogleAccount,
} from '@/app/actions/google'

type ConnectionState = 'loading' | 'connected' | 'disconnected'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading')
  const [isActing, setIsActing] = useState(false)

  const refreshConnectionState = useCallback(async () => {
    const result = await checkGoogleConnection()
    if (result.success) {
      setConnectionState(result.data ? 'connected' : 'disconnected')
    } else {
      setConnectionState('disconnected')
      toast.error(result.error)
    }
  }, [])

  // URL 파라미터로 결과 처리
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'google_connected') {
      toast.success('Google Calendar 연동이 완료되었습니다.')
    } else if (error) {
      const messages: Record<string, string> = {
        google_auth_failed: 'Google 인증에 실패했습니다.',
        google_token_failed: '토큰 교환에 실패했습니다.',
      }
      toast.error(messages[error] ?? `오류가 발생했습니다: ${error}`)
    }
  }, [searchParams])

  // 마운트 시 연동 상태 확인
  useEffect(() => {
    refreshConnectionState()
  }, [refreshConnectionState])

  const handleConnect = async () => {
    setIsActing(true)
    try {
      const result = await getGoogleAuthUrl()
      if (result.success) {
        window.location.href = result.data
      } else {
        toast.error(result.error)
        setIsActing(false)
      }
    } catch {
      toast.error('연결 중 오류가 발생했습니다.')
      setIsActing(false)
    }
  }

  const handleDisconnect = async () => {
    setIsActing(true)
    try {
      const result = await disconnectGoogleAccount()
      if (result.success) {
        toast.success('Google Calendar 연동이 해제되었습니다.')
        setConnectionState('disconnected')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('연동 해제 중 오류가 발생했습니다.')
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 헤더 */}
      <div className="glass-card flex items-center gap-3 rounded-2xl p-5">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5">
          <Settings className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">설정</h2>
          <p className="text-xs text-muted-foreground">연동 및 앱 환경 설정</p>
        </div>
      </div>

      {/* 연동 설정 섹션 */}
      <section className="flex flex-col gap-4">
        <h3 className="px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">
          연동
        </h3>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Google Calendar 정보 */}
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10">
                <Calendar className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-semibold">Google Calendar</p>
                  <ConnectionBadge state={connectionState} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {connectionState === 'connected'
                    ? '수업 일정이 Google Calendar와 동기화됩니다.'
                    : 'Google Calendar와 연동하면 수업 일정을 동기화할 수 있습니다.'}
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="shrink-0">
              {connectionState === 'loading' ? (
                <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
              ) : connectionState === 'connected' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isActing}
                  className={cn(
                    'gap-2 border-destructive/30 text-destructive',
                    'hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  <Unlink2 className="size-3.5" />
                  연동 해제
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isActing}
                  className="gap-2"
                >
                  <Link2 className="size-3.5" />
                  {isActing ? '연결 중...' : 'Google Calendar 연동'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

type ConnectionBadgeProps = {
  readonly state: ConnectionState
}

function ConnectionBadge({ state }: ConnectionBadgeProps) {
  if (state === 'loading') {
    return (
      <span className="h-5 w-12 animate-pulse rounded-full bg-muted" />
    )
  }

  const isConnected = state === 'connected'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        isConnected
          ? 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          isConnected ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-muted-foreground/50'
        )}
      />
      {isConnected ? '연동됨' : '미연동'}
    </span>
  )
}
