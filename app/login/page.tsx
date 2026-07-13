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
import { GraduationCap, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo area above card */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <GraduationCap className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">리아쌤 OS</h1>
        </div>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-bold tracking-tight">
              로그인
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-sm">
              비밀번호를 입력해 학습 관리 시스템에 접속하세요
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
                    className="h-12 pr-11 text-base"
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
                <div className="border-destructive/20 bg-destructive/10 flex items-center gap-2 rounded-xl border px-3 py-2.5">
                  <ShieldAlert className="text-destructive size-4 shrink-0" />
                  <p className="text-destructive text-sm font-medium">
                    {state.error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                size="lg"
                className="h-12 w-full text-base font-bold"
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
          리아쌤 OS v0.1
        </p>
      </div>
    </div>
  )
}
