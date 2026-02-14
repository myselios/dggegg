'use server'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

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

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token || !safeCompare(token, env.AUTH_SECRET)) {
    throw new Error('인증이 필요합니다')
  }
}
