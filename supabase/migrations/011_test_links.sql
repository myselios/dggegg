-- 011_test_links.sql
-- 회차별 테스트링크 (구글폼 등) 관리 테이블

CREATE TABLE IF NOT EXISTS test_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session text NOT NULL,
  url text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session)
);

ALTER TABLE test_links ENABLE ROW LEVEL SECURITY;

-- anon role 전체 허용 (기존 materials 패턴과 동일)
CREATE POLICY "anon_all_test_links" ON test_links
  FOR ALL TO anon USING (true) WITH CHECK (true);
