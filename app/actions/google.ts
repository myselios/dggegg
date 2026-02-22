'use server'

import { requireAuth } from '@/lib/auth'
import { getAuthUrl, disconnectGoogle, isGoogleConnected } from '@/lib/google/auth'
import type { ActionResult } from '@/lib/types/action-result'

export async function getGoogleAuthUrl(): Promise<ActionResult<string>> {
  try {
    await requireAuth()
    const url = getAuthUrl()
    if (!url) {
      return { success: false, error: 'Google OAuth가 설정되지 않았습니다. 환경변수를 확인하세요.' }
    }
    return { success: true, data: url }
  } catch {
    return { success: false, error: 'Google 인증 URL 생성에 실패했습니다' }
  }
}

export async function disconnectGoogleAccount(): Promise<ActionResult<null>> {
  try {
    await requireAuth()
    await disconnectGoogle()
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Google 연동 해제에 실패했습니다' }
  }
}

export async function checkGoogleConnection(): Promise<ActionResult<boolean>> {
  try {
    await requireAuth()
    const connected = await isGoogleConnected()
    return { success: true, data: connected }
  } catch {
    return { success: false, error: '연동 상태 확인에 실패했습니다' }
  }
}
