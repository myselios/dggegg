'use server'

import { cookies } from 'next/headers'

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const secret = process.env.AUTH_SECRET

  if (!secret) {
    throw new Error('AUTH_SECRET 환경변수가 설정되지 않았습니다')
  }

  if (!token || token !== secret) {
    throw new Error('인증이 필요합니다')
  }
}
