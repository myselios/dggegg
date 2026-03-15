'use server'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types/action-result'
import type {
  Material,
  MaterialInsert,
  SessionKey,
  SessionSummary,
} from '@/lib/types/database'

import { getDocsContent as _getDocsContent } from '@/lib/google/docs'
import { summarizeSections as _summarizeSections } from '@/lib/google/gemini'

async function getAndSummarizeDocs(
  docsUrl: string
): Promise<{ readonly success: true; readonly summaries: readonly SessionSummary[] } | { readonly success: false; readonly error: string }> {
  const docsResult = await _getDocsContent(docsUrl)

  if ('error' in docsResult && docsResult.error) {
    return { success: false, error: docsResult.error }
  }

  if (!docsResult.sections) {
    return { success: false, error: 'Google Docs 섹션을 가져올 수 없습니다' }
  }

  const summaries = await _summarizeSections(docsResult.sections)
  return { success: true, summaries }
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const STORAGE_BUCKET = 'materials'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24시간

// Storage URL에서 버킷 내 경로를 추출합니다.
function extractStoragePath(fileUrl: string): string {
  const marker = `/object/public/${STORAGE_BUCKET}/`
  const idx = fileUrl.indexOf(marker)
  if (idx === -1) {
    throw new Error(`Storage 경로를 파싱할 수 없습니다: ${fileUrl}`)
  }
  return fileUrl.slice(idx + marker.length)
}

export async function getMaterials(): Promise<ActionResult<Material[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('session')

    if (error) {
      return { success: false, error: `교재 조회 실패: ${error.message}` }
    }

    return { success: true, data: (data ?? []) as Material[] }
  } catch {
    return { success: false, error: '교재 목록을 불러오는 중 오류가 발생했습니다' }
  }
}

export async function uploadMaterial(
  session: SessionKey,
  formData: FormData
): Promise<ActionResult<Material>> {
  try {
    await requireAuth()

    const file = formData.get('file')
    if (!(file instanceof File)) {
      return { success: false, error: '파일이 없습니다' }
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { success: false, error: 'PDF, PPT, PPTX 형식만 업로드할 수 있습니다' }
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: '파일 크기는 50MB 이하여야 합니다' }
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()
    const storagePath = `${session}/${file.name}`

    const { error: uploadError } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { upsert: true })

    if (uploadError) {
      return { success: false, error: `파일 업로드 실패: ${uploadError.message}` }
    }

    const { data: urlData } = adminClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    const insert: MaterialInsert = {
      session,
      file_name: file.name,
      file_url: urlData.publicUrl,
    }

    const { data, error: dbError } = await supabase
      .from('materials')
      .upsert(insert, { onConflict: 'session' })
      .select()
      .single()

    if (dbError) {
      return { success: false, error: `교재 정보 저장 실패: ${dbError.message}` }
    }

    return { success: true, data: data as Material }
  } catch {
    return { success: false, error: '교재 업로드 중 오류가 발생했습니다' }
  }
}

export async function saveMaterialLink(
  session: SessionKey,
  linkUrl: string,
  linkLabel?: string
): Promise<ActionResult<Material>> {
  try {
    await requireAuth()
    if (!linkUrl.trim()) {
      return { success: false, error: 'URL을 입력해주세요' }
    }
    try {
      new URL(linkUrl)
    } catch {
      return { success: false, error: '유효한 URL이 아닙니다' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('materials')
      .upsert(
        { session, link_url: linkUrl, link_label: linkLabel ?? null },
        { onConflict: 'session' }
      )
      .select()
      .single()

    if (error) {
      return { success: false, error: `링크 저장 실패: ${error.message}` }
    }
    return { success: true, data: data as Material }
  } catch {
    return { success: false, error: '링크 저장 중 오류가 발생했습니다' }
  }
}

export async function deleteMaterialLink(session: SessionKey): Promise<ActionResult<void>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { error } = await supabase
      .from('materials')
      .update({ link_url: null, link_label: null })
      .eq('session', session)

    if (error) {
      return { success: false, error: `링크 삭제 실패: ${error.message}` }
    }
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: '링크 삭제 중 오류가 발생했습니다' }
  }
}

export async function deleteMaterial(id: string): Promise<ActionResult<void>> {
  try {
    await requireAuth()
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data, error: fetchError } = await supabase
      .from('materials')
      .select('file_url')
      .eq('id', id)
      .single()

    if (fetchError || !data) {
      return { success: false, error: `교재를 찾을 수 없습니다: ${fetchError?.message ?? ''}` }
    }

    const storagePath = extractStoragePath(data.file_url)

    const { error: storageError } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath])

    if (storageError) {
      return { success: false, error: `Storage 파일 삭제 실패: ${storageError.message}` }
    }

    const { error: dbError } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)

    if (dbError) {
      return { success: false, error: `교재 레코드 삭제 실패: ${dbError.message}` }
    }

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: '교재 삭제 중 오류가 발생했습니다' }
  }
}

export async function saveStudentDocsUrl(
  studentId: string,
  docsUrl: string
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
        { onConflict: 'student_id' }
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
  studentId: string
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
  studentId: string
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
  studentId: string
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
        { onConflict: 'student_id' }
      )

    if (cacheError) {
      return { success: false, error: `캐시 저장 실패: ${cacheError.message}` }
    }

    return { success: true, data: summaries }
  } catch {
    return { success: false, error: '학생 진도 갱신 중 오류가 발생했습니다' }
  }
}
