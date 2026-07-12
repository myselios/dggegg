-- ============================================================
-- 학생 이름 복원 (로컬 백업 기반)
-- 사용법: Supabase SQL Editor에서 붙여넣고 Run
-- 전제: setup-new-project.sql이 이미 실행되어 students 테이블 존재
-- 주의: school은 임시 플레이스홀더 '학교명'. 사용 시 실제 값으로 수정 필요
-- ============================================================

INSERT INTO students (name_ko, school, status) VALUES
  ('소율',  '학교명', 'active'),
  ('주원',  '학교명', 'active'),
  ('재민',  '학교명', 'active'),
  ('연수',  '학교명', 'active'),
  ('영우',  '학교명', 'active'),
  ('지윤',  '학교명', 'active'),
  ('조호',  '학교명', 'active'),
  ('석현',  '학교명', 'active'),
  ('jerry', '학교명', 'active'),
  ('서아',  '학교명', 'active'),
  ('현중',  '학교명', 'active'),
  ('지민',  '학교명', 'active'),
  ('선이',  '학교명', 'active'),
  ('은서',  '학교명', 'active'),
  ('현서',  '학교명', 'active'),
  ('휘종',  '학교명', 'active'),
  ('네일',  '학교명', 'active')
ON CONFLICT DO NOTHING;

-- 결과 확인
SELECT name_ko, school, status, created_at FROM students ORDER BY name_ko;
