'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { MessageTemplate } from '@/lib/types/database'

async function fetchTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await createClient()
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as MessageTemplate[]
}

export function useTemplates() {
  return useSWR<MessageTemplate[]>('templates', fetchTemplates, {
    keepPreviousData: true,
  })
}
