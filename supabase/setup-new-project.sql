-- ============================================================
-- 신규 Supabase 프로젝트 초기 세팅 (001~011 통합)
-- 사용법: Supabase SQL Editor에서 이 파일 내용 전체를 붙여넣고 Run
-- 대상: 완전히 비어있는 새 프로젝트
-- ============================================================

-- ------------------------------------------------------------
-- 001_initial_schema.sql
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT NOT NULL,
  name_en TEXT,
  grade TEXT,
  school TEXT NOT NULL,
  ib_course TEXT CHECK (ib_course IN ('Ab initio', 'SL', 'HL')),
  exam_date DATE,
  target_score SMALLINT,
  current_score SMALLINT,
  weakness_areas TEXT[],
  contact_student TEXT,
  contact_parent TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  color TEXT,
  custom_fields JSONB DEFAULT '{}',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  sessions_per_week SMALLINT,
  lesson_type TEXT DEFAULT '1:1',
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  template_type TEXT,
  recurrence_rule TEXT,
  recurrence_group_id UUID,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  content TEXT,
  homework TEXT,
  next_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS score_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL,
  score NUMERIC(5,2),
  max_score NUMERIC(5,2) DEFAULT 7,
  comment TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consultation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('consultation', 'complaint', 'request', 'notice')),
  content TEXT NOT NULL,
  tags TEXT[],
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  school_tag TEXT NOT NULL,
  tags TEXT[],
  file_url TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_materials (
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_events_student ON schedule_events(student_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON schedule_events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON schedule_events(status);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_event ON lesson_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_student ON score_records(student_id);
CREATE INDEX IF NOT EXISTS idx_consult_student ON consultation_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_materials_school ON materials(school_tag);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_updated_at ON students;
CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON schedule_events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 002_add_constraints.sql
-- ------------------------------------------------------------

ALTER TABLE lesson_notes
  DROP CONSTRAINT IF EXISTS lesson_notes_event_id_unique;
ALTER TABLE lesson_notes
  ADD CONSTRAINT lesson_notes_event_id_unique UNIQUE (event_id);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON students;
CREATE POLICY "Allow all for anon" ON students FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON enrollments;
CREATE POLICY "Allow all for anon" ON enrollments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON schedule_events;
CREATE POLICY "Allow all for anon" ON schedule_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON lesson_notes;
CREATE POLICY "Allow all for anon" ON lesson_notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE score_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON score_records;
CREATE POLICY "Allow all for anon" ON score_records FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE consultation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON consultation_logs;
CREATE POLICY "Allow all for anon" ON consultation_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON materials;
CREATE POLICY "Allow all for anon" ON materials FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE event_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON event_materials;
CREATE POLICY "Allow all for anon" ON event_materials FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 003_add_student_fields.sql
-- ------------------------------------------------------------

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS residence TEXT,
  ADD COLUMN IF NOT EXISTS kakao_id TEXT,
  ADD COLUMN IF NOT EXISTS zoom_url TEXT;

-- ------------------------------------------------------------
-- 004_drop_student_fields.sql
-- ------------------------------------------------------------

ALTER TABLE students
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS kakao_id,
  DROP COLUMN IF EXISTS zoom_url,
  DROP COLUMN IF EXISTS contact_student,
  DROP COLUMN IF EXISTS exam_date,
  DROP COLUMN IF EXISTS target_score;

-- ------------------------------------------------------------
-- 005_make_student_id_nullable.sql
-- ------------------------------------------------------------

ALTER TABLE schedule_events
  ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'lesson'
    CHECK (event_type IN ('lesson', 'memo'));

ALTER TABLE schedule_events
  DROP CONSTRAINT IF EXISTS check_event_type;
ALTER TABLE schedule_events
  ADD CONSTRAINT check_event_type CHECK (
    (student_id IS NOT NULL) OR (title IS NOT NULL)
  );

UPDATE schedule_events SET event_type = 'lesson' WHERE student_id IS NOT NULL AND event_type IS NULL;

-- ------------------------------------------------------------
-- 006_google_calendar_sync.sql
-- ------------------------------------------------------------

ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

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

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage oauth tokens" ON oauth_tokens;
CREATE POLICY "Authenticated users can manage oauth tokens"
  ON oauth_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 007_materials.sql
--   주의: 이 마이그레이션은 001의 materials 테이블과 다른 구조입니다.
--   001에서 만든 title/school_tag 기반 materials를 삭제하고 session 기반으로 재생성합니다.
--   빈 프로젝트라서 데이터 손실 없음.
-- ------------------------------------------------------------

DROP TABLE IF EXISTS event_materials;
DROP TABLE IF EXISTS materials;

CREATE TABLE IF NOT EXISTS materials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session    TEXT NOT NULL CHECK (session IN ('OT', '1', '2', '3', '4', '5', '6', '7')),
  file_name  TEXT NOT NULL,
  file_url   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session)
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage materials" ON materials;
CREATE POLICY "Authenticated users can manage materials"
  ON materials
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS student_docs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  docs_url       TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE student_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage student_docs" ON student_docs;
CREATE POLICY "Authenticated users can manage student_docs"
  ON student_docs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS materials_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  summary_data JSONB NOT NULL DEFAULT '[]',
  cached_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE materials_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage materials_cache" ON materials_cache;
CREATE POLICY "Authenticated users can manage materials_cache"
  ON materials_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 008_message_templates.sql
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS message_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL CHECK (category IN ('first_consult', 'after_lesson', 're_enrollment', 'other')),
  title       text NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_templates_updated_at ON message_templates;
CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON message_templates;
CREATE POLICY "Allow all for anon"
  ON message_templates FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 009_weekly_memos.sql
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS weekly_memos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key    text NOT NULL UNIQUE,
  content     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS weekly_memos_updated_at ON weekly_memos;
CREATE TRIGGER weekly_memos_updated_at
  BEFORE UPDATE ON weekly_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE weekly_memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON weekly_memos;
CREATE POLICY "Allow all for anon"
  ON weekly_memos FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 010_materials_link.sql
-- ------------------------------------------------------------

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_label text;

-- materials.file_name / file_url을 NOT NULL에서 NULLABLE로 변경 (링크 전용 항목 지원)
ALTER TABLE materials ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE materials ALTER COLUMN file_url DROP NOT NULL;

-- ------------------------------------------------------------
-- 011_test_links.sql
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS test_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session text NOT NULL,
  url text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session)
);

ALTER TABLE test_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_test_links" ON test_links;
CREATE POLICY "anon_all_test_links" ON test_links
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- 완료. 성공하면 아래 쿼리로 확인:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- 아래 12개 테이블이 있어야 정상:
--   consultation_logs, enrollments, lesson_notes, materials, materials_cache,
--   message_templates, oauth_tokens, schedule_events, score_records, student_docs,
--   students, test_links, weekly_memos
-- ============================================================
