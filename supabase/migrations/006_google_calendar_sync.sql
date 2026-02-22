-- Google Calendar 동기화를 위한 컬럼 추가 (기존 데이터 영향 없음)
ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- OAuth 토큰 저장 테이블 (신규)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider       TEXT NOT NULL DEFAULT 'google',
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  token_type     TEXT DEFAULT 'Bearer',
  expires_at     TIMESTAMPTZ NOT NULL,
  scope          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider)
);

-- RLS 정책 (1인 사용자이므로 인증된 사용자만 접근)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage oauth tokens"
  ON oauth_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
