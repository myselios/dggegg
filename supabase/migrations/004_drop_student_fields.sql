-- 사용하지 않는 학생 필드 삭제
ALTER TABLE students
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS kakao_id,
  DROP COLUMN IF EXISTS zoom_url,
  DROP COLUMN IF EXISTS contact_student,
  DROP COLUMN IF EXISTS exam_date,
  DROP COLUMN IF EXISTS target_score;
