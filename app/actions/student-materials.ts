'use server'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getDocsContent } from '@/lib/google/docs'
import { summarizeSections } from '@/lib/google/gemini'
import type { ActionResult } from '@/lib/types/action-result'
import type { SessionSummary } from '@/lib/types/database'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24시간

async function getAndSummarizeDocs(
  docsUrl: string,
): Promise<
  | { readonly success: true; readonly summaries: readonly SessionSummary[] }
  | { readonly success: false; readonly error: string }
> {
  const docsResult = await getDocsContent(docsUrl)

  if ('error' in docsResult && docsResult.error) {
    return { success: false, error: docsResult.error }
  }

  if (!docsResult.sections) {
    return { success: false, error: 'Google Docs 섹션을 가져올 수 없습니다' }
  }

  const summaries = await summarizeSections(docsResult.sections)
  return { success: true, summaries }
}

export async function saveStudentDocsUrl(
  studentId: string,
  docsUrl: string,
): Promise<ActionResult<void>> {
  try {
    await requireAuth()

    if (!docsUrl.includes('docs.google.com/document')) {
      return { success: false, error: '유효한 Google Docs URL이 아닙니다' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('student_docs')
      .upsert(
        { student_id: studentId, docs_url: docsUrl },
        { onConflict: 'student_id' },
      )

    if (error) {
      return { success: false, error: `Docs URL 저장 실패: ${error.message}` }
    }

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Docs URL 저장 중 오류가 발생했습니다' }
  }
}

export async function deleteStudentDocsUrl(
  studentId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { error: docsError } = await supabase
      .from('student_docs')
      .delete()
      .eq('student_id', studentId)

    if (docsError) {
      return { success: false, error: `Docs URL 삭제 실패: ${docsError.message}` }
    }

    const { error: cacheError } = await supabase
      .from('materials_cache')
      .delete()
      .eq('student_id', studentId)

    if (cacheError) {
      return { success: false, error: `캐시 삭제 실패: ${cacheError.message}` }
    }

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Docs URL 삭제 중 오류가 발생했습니다' }
  }
}

export async function getStudentProgress(
  studentId: string,
): Promise<ActionResult<readonly SessionSummary[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: cache, error } = await supabase
      .from('materials_cache')
      .select('summary_data, cached_at')
      .eq('student_id', studentId)
      .single()

    if (!error && cache) {
      const cachedAt = new Date(cache.cached_at).getTime()
      const isValid = Date.now() - cachedAt < CACHE_TTL_MS

      if (isValid) {
        return {
          success: true,
          data: cache.summary_data as readonly SessionSummary[],
        }
      }
    }

    return refreshStudentProgress(studentId)
  } catch {
    return { success: false, error: '학생 진도 조회 중 오류가 발생했습니다' }
  }
}

export async function refreshStudentProgress(
  studentId: string,
): Promise<ActionResult<readonly SessionSummary[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: docRow, error: docError } = await supabase
      .from('student_docs')
      .select('docs_url')
      .eq('student_id', studentId)
      .single()

    if (docError || !docRow?.docs_url) {
      return { success: false, error: '연결된 Google Docs가 없습니다' }
    }

    const result = await getAndSummarizeDocs(docRow.docs_url)
    if (!result.success) {
      return { success: false, error: result.error }
    }
    const summaries = result.summaries

    const { error: cacheError } = await supabase
      .from('materials_cache')
      .upsert(
        {
          student_id: studentId,
          summary_data: summaries,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' },
      )

    if (cacheError) {
      return { success: false, error: `캐시 저장 실패: ${cacheError.message}` }
    }

    return { success: true, data: summaries }
  } catch {
    return { success: false, error: '학생 진도 갱신 중 오류가 발생했습니다' }
  }
}
