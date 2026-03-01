import { createClient } from '@supabase/supabase-js'
import { publicEnv, serverEnv } from '@/lib/env'

// Service role client — bypasses RLS, server-side only
// Used for storage uploads/deletes so anon key cannot write directly
export function createAdminClient() {
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.'
    )
  }
  return createClient(publicEnv.SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
