'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/action-result'
import type { MessageTemplate, MessageTemplateInsert, MessageTemplateUpdate, TemplateCategory } from '@/lib/types/database'

const TemplateCategorySchema = z.enum(['first_consult', 'after_lesson', 're_enrollment', 'other'])

const TemplateInsertSchema = z.object({
  category: TemplateCategorySchema,
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요'),
})

const TemplateUpdateSchema = TemplateInsertSchema.partial()

export async function getTemplates(
  category?: TemplateCategory
): Promise<ActionResult<MessageTemplate[]>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    let query = supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: `템플릿 조회 실패: ${error.message}` }
    }

    return { success: true, data: (data ?? []) as MessageTemplate[] }
  } catch {
    return { success: false, error: '템플릿 목록을 불러오는 중 오류가 발생했습니다' }
  }
}

export async function createTemplate(
  input: MessageTemplateInsert
): Promise<ActionResult<MessageTemplate>> {
  try {
    await requireAuth()

    const parsed = TemplateInsertSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? '입력 값이 올바르지 않습니다' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('message_templates')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      return { success: false, error: `템플릿 저장 실패: ${error.message}` }
    }

    return { success: true, data: data as MessageTemplate }
  } catch {
    return { success: false, error: '템플릿 저장 중 오류가 발생했습니다' }
  }
}

export async function updateTemplate(
  id: string,
  input: MessageTemplateUpdate
): Promise<ActionResult<MessageTemplate>> {
  try {
    await requireAuth()

    const parsed = TemplateUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? '입력 값이 올바르지 않습니다' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('message_templates')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: `템플릿 수정 실패: ${error.message}` }
    }

    return { success: true, data: data as MessageTemplate }
  } catch {
    return { success: false, error: '템플릿 수정 중 오류가 발생했습니다' }
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult<void>> {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: `템플릿 삭제 실패: ${error.message}` }
    }

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: '템플릿 삭제 중 오류가 발생했습니다' }
  }
}
