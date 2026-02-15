'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

function getSupabase() {
  return createClient()
}

async function fetchEvents([, start, end]: [string, string, string]): Promise<ScheduleEventWithStudent[]> {
  const { data, error } = await getSupabase()
    .from('schedule_events')
    .select('*, students(id, name_ko, school, ib_course)')
    .gte('start_at', start)
    .lte('start_at', end)
    .order('start_at')

  if (error) throw new Error(error.message)
  return data as ScheduleEventWithStudent[]
}

export function useScheduleEvents(startDate: string, endDate: string) {
  return useSWR<ScheduleEventWithStudent[]>(
    ['schedule-events', startDate, endDate],
    fetchEvents
  )
}
