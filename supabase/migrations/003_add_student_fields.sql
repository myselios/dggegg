-- 학생 테이블에 거주지, 카카오톡 ID, Zoom URL 필드 추가
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS residence TEXT,
  ADD COLUMN IF NOT EXISTS kakao_id TEXT,
  ADD COLUMN IF NOT EXISTS zoom_url TEXT;
