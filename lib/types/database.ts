export type Student = {
  readonly id: string
  readonly name_ko: string
  readonly grade: string | null
  readonly school: string
  readonly ib_course: 'Ab initio' | 'SL' | 'HL' | 'IGCSE' | 'MYP' | '기타' | null
  readonly current_score: number | null
  readonly weakness_areas: string[] | null
  readonly residence: string | null
  readonly contact_parent: string | null
  readonly status: 'active' | 'paused' | 'ended'
  readonly color: string | null
  readonly custom_fields: Record<string, unknown>
  readonly memo: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type StudentInsert = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'status' | 'custom_fields'> & {
  readonly status?: Student['status']
  readonly custom_fields?: Record<string, unknown>
}

export type StudentUpdate = Partial<StudentInsert>

export type Enrollment = {
  readonly id: string
  readonly student_id: string
  readonly start_date: string
  readonly end_date: string | null
  readonly sessions_per_week: number | null
  readonly lesson_type: string
  readonly notes: string | null
  readonly status: 'active' | 'paused' | 'ended'
  readonly created_at: string
}

export type EnrollmentInsert = Omit<Enrollment, 'id' | 'created_at'>

export type ScheduleEvent = {
  readonly id: string
  readonly student_id: string | null
  readonly start_at: string
  readonly end_at: string
  readonly status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  readonly template_type: string | null
  readonly recurrence_rule: string | null
  readonly recurrence_group_id: string | null
  readonly color: string | null
  readonly title: string | null
  readonly event_type: 'lesson' | 'memo'
  readonly created_at: string
  readonly updated_at: string
}

// event_type excluded: column not yet in production DB (migration 005 pending)
export type ScheduleEventInsert = Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at' | 'event_type'>

export type ScheduleEventUpdate = Partial<ScheduleEventInsert>

export type LessonNote = {
  readonly id: string
  readonly event_id: string
  readonly student_id: string
  readonly content: string | null
  readonly homework: string | null
  readonly next_goal: string | null
  readonly created_at: string
}

export type LessonNoteInsert = Omit<LessonNote, 'id' | 'created_at'>

export type ScoreRecord = {
  readonly id: string
  readonly student_id: string
  readonly event_id: string | null
  readonly assessment_type: string
  readonly score: number | null
  readonly max_score: number
  readonly comment: string | null
  readonly date: string
  readonly created_at: string
}

export type ScoreRecordInsert = Omit<ScoreRecord, 'id' | 'created_at'>

export type ConsultationLog = {
  readonly id: string
  readonly student_id: string
  readonly event_id: string | null
  readonly type: 'consultation' | 'complaint' | 'request' | 'notice'
  readonly content: string
  readonly tags: string[] | null
  readonly date: string
  readonly created_at: string
}

export type ConsultationLogInsert = Omit<ConsultationLog, 'id' | 'created_at'>

// 조인 타입
export type ScheduleEventWithStudent = ScheduleEvent & {
  readonly students: Pick<Student, 'id' | 'name_ko' | 'school' | 'ib_course'> | null
}

export type LessonNoteWithEvent = LessonNote & {
  readonly schedule_events: Pick<ScheduleEvent, 'id' | 'start_at' | 'template_type'>
}
