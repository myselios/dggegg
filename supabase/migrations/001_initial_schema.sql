-- students
CREATE TABLE students (
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

-- enrollments
CREATE TABLE enrollments (
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

-- schedule_events (허브)
CREATE TABLE schedule_events (
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

-- lesson_notes
CREATE TABLE lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  content TEXT,
  homework TEXT,
  next_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- score_records
CREATE TABLE score_records (
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

-- consultation_logs
CREATE TABLE consultation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('consultation', 'complaint', 'request', 'notice')),
  content TEXT NOT NULL,
  tags TEXT[],
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- materials (MVP-1)
CREATE TABLE materials (
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

-- event_materials (MVP-1)
CREATE TABLE event_materials (
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, material_id)
);

-- Indexes
CREATE INDEX idx_events_student ON schedule_events(student_id);
CREATE INDEX idx_events_start ON schedule_events(start_at);
CREATE INDEX idx_events_status ON schedule_events(status);
CREATE INDEX idx_lesson_notes_event ON lesson_notes(event_id);
CREATE INDEX idx_scores_student ON score_records(student_id);
CREATE INDEX idx_consult_student ON consultation_logs(student_id);
CREATE INDEX idx_materials_school ON materials(school_tag);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
