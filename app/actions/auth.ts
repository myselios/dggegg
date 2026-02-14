'use server'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/lib/env'

type AuthState = { error: string } | null

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // 길이가 다르면 동일 길이의 더미와 비교하여 일정 시간 소요
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get('password') as string

  const expected = env.AUTH_PASSWORD
  const isValid = safeCompare(password, expected)

  if (!isValid) {
    return { error: '비밀번호가 올바르지 않습니다' }
  }

  const cookieStore = await cookies()
  cookieStore.set('auth-token', env.AUTH_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: '/',
  })

  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  redirect('/login')
}
