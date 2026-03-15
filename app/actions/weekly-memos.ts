'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/action-result'
import type { WeeklyMemo } from '@/lib/types/database'

const WeekKeySchema = z.string().regex(/^\d{4}-W\d{2}$/, '올바른 주 키 형식이 아닙니다 (예: 2026-W11)')

export async function getWeeklyMemo(weekKey: string): Promise<ActionResult<WeeklyMemo | null>> {
  try {
    await requireAuth()
    WeekKeySchema.parse(weekKey)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('weekly_memos')
      .select('*')
      .eq('week_key', weekKey)
      .maybeSingle()

    if (error) {
      return { success: false, error: `메모 조회 실패: ${error.message}` }
    }

    return { success: true, data: data as WeeklyMemo | null }
  } catch {
    return { success: false, error: '메모를 불러오는 중 오류가 발생했습니다' }
  }
}

export async function upsertWeeklyMemo(
  weekKey: string,
  content: string
): Promise<ActionResult<WeeklyMemo>> {
  try {
    await requireAuth()
    WeekKeySchema.parse(weekKey)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('weekly_memos')
      .upsert({ week_key: weekKey, content }, { onConflict: 'week_key' })
      .select()
      .single()

    if (error) {
      return { success: false, error: `메모 저장 실패: ${error.message}` }
    }

    return { success: true, data: data as WeeklyMemo }
  } catch {
    return { success: false, error: '메모를 저장하는 중 오류가 발생했습니다' }
  }
}
