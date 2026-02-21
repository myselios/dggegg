import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/** E2E_ 로 시작하는 테스트 학생 삭제 */
export async function cleanupE2EStudents() {
  const { error } = await supabase
    .from('students')
    .delete()
    .like('name_ko', 'E2E_%')

  if (error) {
    console.error('E2E 학생 cleanup 실패:', error.message)
  }
}

/** E2E 테스트에서 생성한 메모 이벤트 삭제 */
export async function cleanupE2EMemos() {
  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .like('title', 'E2E %')

  if (error) {
    console.error('E2E 메모 cleanup 실패:', error.message)
  }
}
