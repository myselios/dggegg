'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Material, TestLink, Student } from '@/lib/types/database'

export type MaterialsPageData = {
  readonly materials: Material[]
  readonly testLinks: TestLink[]
  readonly students: Student[]
}

async function fetchMaterialsPage(): Promise<MaterialsPageData> {
  const supabase = createClient()
  const [materialsRes, testLinksRes, studentsRes] = await Promise.all([
    supabase.from('materials').select('*').order('session'),
    supabase.from('test_links').select('*').order('session'),
    supabase.from('students').select('*').eq('status', 'active').order('name_ko'),
  ])

  if (materialsRes.error) throw new Error(materialsRes.error.message)
  if (testLinksRes.error) throw new Error(testLinksRes.error.message)
  if (studentsRes.error) throw new Error(studentsRes.error.message)

  return {
    materials: (materialsRes.data ?? []) as Material[],
    testLinks: (testLinksRes.data ?? []) as TestLink[],
    students: (studentsRes.data ?? []) as Student[],
  }
}

export function useMaterialsPage() {
  return useSWR<MaterialsPageData>('materials-page', fetchMaterialsPage, {
    keepPreviousData: true,
  })
}
