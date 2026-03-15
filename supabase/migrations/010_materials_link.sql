-- 010_materials_link.sql
-- materials 테이블에 링크 필드 추가 (회차별 교재 링크 + 라벨)

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_label text;
