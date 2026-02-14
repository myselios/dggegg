// Public env vars: Next.js inlines process.env.NEXT_PUBLIC_* at compile time
// Must use direct references (not dynamic process.env[name]) for client-side access
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_URL이(가) 설정되지 않았습니다')
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_ANON_KEY이(가) 설정되지 않았습니다')
}

export const publicEnv = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} as const

// Server-only env vars: only accessed on the server side
function requireServerEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다`)
  }
  return value
}

export const serverEnv = {
  get AUTH_PASSWORD() {
    return requireServerEnv('AUTH_PASSWORD')
  },
  get AUTH_SECRET() {
    return requireServerEnv('AUTH_SECRET')
  },
} as const
