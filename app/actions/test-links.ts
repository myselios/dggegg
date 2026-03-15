'use server'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/action-result'
import type { TestLink, SessionKey } from '@/lib/types/database'

export async function getTestLinks(): Promise<ActionResult<TestLink[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('test_links')
      .select('*')
      .order('session')

    if (error) {
      return { success: false, error: `테스트링크 조회 실패: ${error.message}` }
    }
    return { success: true, data: (data ?? []) as TestLink[] }
  } catch {
    return { success: false, error: '테스트링크 목록을 불러오는 중 오류가 발생했습니다' }
  }
}

export async function upsertTestLink(
  session: SessionKey,
  url: string,
  label?: string
): Promise<ActionResult<TestLink>> {
  try {
    await requireAuth()
    if (!url.trim()) {
      return { success: false, error: 'URL을 입력해주세요' }
    }
    try {
      new URL(url)
    } catch {
      return { success: false, error: '유효한 URL이 아닙니다' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('test_links')
      .upsert(
        { session, url, label: label ?? null },
        { onConflict: 'session' }
      )
      .select()
      .single()

    if (error) {
      return { success: false, error: `테스트링크 저장 실패: ${error.message}` }
    }
    return { success: true, data: data as TestLink }
  } catch {
    return { success: false, error: '테스트링크 저장 중 오류가 발생했습니다' }
  }
}

export async function deleteTestLink(session: SessionKey): Promise<ActionResult<void>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { error } = await supabase
      .from('test_links')
      .delete()
      .eq('session', session)

    if (error) {
      return { success: false, error: `테스트링크 삭제 실패: ${error.message}` }
    }
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: '테스트링크 삭제 중 오류가 발생했습니다' }
  }
}
