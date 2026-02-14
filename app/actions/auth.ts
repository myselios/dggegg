'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type AuthState = { error: string } | null

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get('password') as string

  if (password !== process.env.AUTH_PASSWORD) {
    return { error: '비밀번호가 올바르지 않습니다' }
  }

  const cookieStore = await cookies()
  cookieStore.set('auth-token', process.env.AUTH_SECRET!, {
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
