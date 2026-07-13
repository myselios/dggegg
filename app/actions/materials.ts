'use server'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types/action-result'
import type { Material, MaterialInsert, SessionKey } from '@/lib/types/database'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const STORAGE_BUCKET = 'materials'

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
