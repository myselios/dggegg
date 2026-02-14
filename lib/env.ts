function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다`)
  }
  return value
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  },
  get AUTH_PASSWORD() {
    return requireEnv('AUTH_PASSWORD')
  },
  get AUTH_SECRET() {
    return requireEnv('AUTH_SECRET')
  },
} as const
