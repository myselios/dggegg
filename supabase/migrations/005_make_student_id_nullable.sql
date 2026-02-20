-- Make student_id nullable to support personal memos
ALTER TABLE schedule_events
  ALTER COLUMN student_id DROP NOT NULL;

-- Add title column for personal memos
ALTER TABLE schedule_events
  ADD COLUMN title TEXT;

-- Add event_type column to distinguish between lesson and memo
ALTER TABLE schedule_events
  ADD COLUMN event_type TEXT DEFAULT 'lesson' CHECK (event_type IN ('lesson', 'memo'));

-- Add check constraint: must have either student_id OR title
ALTER TABLE schedule_events
  ADD CONSTRAINT check_event_type CHECK (
    (student_id IS NOT NULL) OR (title IS NOT NULL)
  );

-- Update existing rows to have event_type = 'lesson'
UPDATE schedule_events SET event_type = 'lesson' WHERE student_id IS NOT NULL;
