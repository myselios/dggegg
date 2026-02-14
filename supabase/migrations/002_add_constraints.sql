-- lesson_notes.event_id에 UNIQUE 제약 추가
-- upsert(onConflict: 'event_id') 정상 동작을 위해 필요
ALTER TABLE lesson_notes
  ADD CONSTRAINT lesson_notes_event_id_unique UNIQUE (event_id);

-- RLS 활성화 및 기본 허용 정책
-- 1인 강사 앱이므로 anon key 기반 전체 허용, 추후 세밀한 정책으로 교체 가능

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON students FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON enrollments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON schedule_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON lesson_notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE score_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON score_records FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE consultation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON consultation_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON materials FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE event_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON event_materials FOR ALL USING (true) WITH CHECK (true);
