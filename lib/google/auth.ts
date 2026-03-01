import { google } from 'googleapis'
import { serverEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const GOOGLE_DOCS_SCOPE = 'https://www.googleapis.com/auth/documents.readonly'
const TOKEN_EXPIRY_BUFFER_SECONDS = 60
const PROVIDER = 'google'

// OAuth2 클라이언트를 생성합니다. 환경변수가 없으면 null을 반환합니다.
export function createOAuth2Client() {
  const clientId = serverEnv.GOOGLE_CLIENT_ID
  const clientSecret = serverEnv.GOOGLE_CLIENT_SECRET
  const redirectUri = serverEnv.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return null
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

// Google 로그인 URL을 생성합니다. OAuth가 설정되지 않았으면 null을 반환합니다.
export function getAuthUrl(): string | null {
  const client = createOAuth2Client()
  if (!client) {
    return null
  }

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GOOGLE_CALENDAR_SCOPE, GOOGLE_DOCS_SCOPE],
  })
}

// 인가 코드를 토큰으로 교환하고 Supabase oauth_tokens 테이블에 저장합니다.
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuth2Client()
  if (!client) {
    throw new Error('Google OAuth가 설정되지 않았습니다')
  }

  const { tokens } = await client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Google에서 유효한 토큰을 받지 못했습니다')
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString()

  const supabase = await createClient()

  const { error } = await supabase.from('oauth_tokens').upsert(
    {
      provider: PROVIDER,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type ?? 'Bearer',
      expires_at: expiresAt,
      scope: tokens.scope ?? GOOGLE_CALENDAR_SCOPE,
    },
    { onConflict: 'provider' }
  )

  if (error) {
    throw new Error(`토큰 저장 실패: ${error.message}`)
  }
}

// DB에서 토큰을 로드하고 인증된 OAuth2 클라이언트를 반환합니다.
// 토큰이 만료 임박(60초 이내)이면 자동 갱신합니다.
// 토큰이 없거나 OAuth가 설정되지 않은 경우 null을 반환합니다.
export async function getAuthenticatedClient() {
  const client = createOAuth2Client()
  if (!client) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', PROVIDER)
    .single()

  if (error || !data) {
    return null
  }

  const expiresAt = new Date(data.expires_at).getTime()
  const nowWithBuffer = Date.now() + TOKEN_EXPIRY_BUFFER_SECONDS * 1000
  const isExpired = expiresAt < nowWithBuffer

  if (isExpired) {
    client.setCredentials({
      refresh_token: data.refresh_token,
    })

    const { credentials } = await client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('액세스 토큰 갱신 실패: 토큰을 받지 못했습니다')
    }

    const newExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: credentials.access_token,
        token_type: credentials.token_type ?? data.token_type ?? 'Bearer',
        expires_at: newExpiresAt,
        scope: credentials.scope ?? data.scope,
      })
      .eq('provider', PROVIDER)

    if (updateError) {
      throw new Error(`갱신된 토큰 저장 실패: ${updateError.message}`)
    }

    client.setCredentials(credentials)
    return client
  }

  client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type ?? 'Bearer',
    expiry_date: new Date(data.expires_at).getTime(),
    scope: data.scope ?? undefined,
  })

  return client
}

// Supabase에서 Google OAuth 토큰을 삭제합니다.
export async function disconnectGoogle(): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('oauth_tokens')
    .delete()
    .eq('provider', PROVIDER)

  if (error) {
    throw new Error(`Google 연결 해제 실패: ${error.message}`)
  }
}

// Google OAuth 토큰이 DB에 존재하는지 확인합니다.
export async function isGoogleConnected(): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('id')
    .eq('provider', PROVIDER)
    .single()

  if (error || !data) {
    return false
  }

  return true
}
