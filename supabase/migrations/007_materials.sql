-- 수업교재 테이블
CREATE TABLE IF NOT EXISTS materials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session    TEXT NOT NULL CHECK (session IN ('OT', '1', '2', '3', '4', '5', '6', '7')),
  file_name  TEXT NOT NULL,
  file_url   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session)
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage materials"
  ON materials
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 학생별 Google Docs URL 테이블
CREATE TABLE IF NOT EXISTS student_docs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  docs_url       TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE student_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage student_docs"
  ON student_docs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- AI 요약 캐시 테이블
CREATE TABLE IF NOT EXISTS materials_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  summary_data JSONB NOT NULL DEFAULT '[]',
  cached_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE materials_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage materials_cache"
  ON materials_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);
