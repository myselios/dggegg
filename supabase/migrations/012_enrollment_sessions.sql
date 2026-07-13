-- 012_enrollment_sessions.sql
-- 회차 패키지(정산) 컬럼 추가

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS total_sessions SMALLINT;      -- 패키지 회차(예: 8회). NULL이면 무제한/월제
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_note TEXT;            -- 정산 메모
