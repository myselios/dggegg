'use client'

import { useActionState, useState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Rocket, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 bg-[oklch(0.97_0.008_270)]  dark:bg-[oklch(0.11_0.015_265)]">
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-300/40 blur-[100px] dark:bg-indigo-700/20" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-300/30 blur-[100px] dark:bg-violet-800/15" />
        <div className="absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/25 blur-[80px] dark:bg-blue-900/10" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-pink-200/15 blur-[80px] dark:bg-pink-900/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo area above card */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Rocket className="size-7 text-primary-foreground" />
          </div>
        </div>

        <Card className="rounded-2xl border-white/25 bg-white/60 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl dark:border-white/8 dark:bg-white/5 dark:shadow-black/30">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              리아쌤 Tutor OS
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-sm">
              학습 관리 시스템에 접속하려면 비밀번호를 입력하세요
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <form action={formAction} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    required
                    autoFocus
                    className="h-11 pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/50">
                  <ShieldAlert className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {state.error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                size="lg"
                className="h-11 w-full text-base font-semibold"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          리아쌤 Tutor OS v0.1
        </p>
      </div>
    </div>
  )
}
