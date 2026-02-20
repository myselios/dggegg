import { z } from 'zod'
import { uuidSchema, datetimeSchema } from './common'

const eventStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'no_show'])
const eventTypeSchema = z.enum(['lesson', 'memo'])

const baseScheduleEventSchema = z.object({
  student_id: uuidSchema.nullable().default(null),
  title: z.string().max(200).nullable().default(null),
  event_type: eventTypeSchema.default('lesson'),
  start_at: datetimeSchema,
  end_at: datetimeSchema,
  status: eventStatusSchema,
  template_type: z.string().max(100).nullable().default(null),
  recurrence_rule: z.string().max(200).nullable().default(null),
  recurrence_group_id: z.string().uuid().nullable().default(null),
  color: z.string().max(50).nullable().default(null),
})

export const scheduleEventInsertSchema = baseScheduleEventSchema.refine(
  (data) => data.student_id !== null || data.title !== null,
  { message: '수업(student_id) 또는 메모(title) 중 하나는 필수입니다' }
)

export const scheduleEventUpdateSchema = baseScheduleEventSchema.partial()

export const recurringEventSchema = z.object({
  baseEvent: baseScheduleEventSchema.omit({ recurrence_group_id: true }).refine(
    (data) => data.student_id !== null || data.title !== null,
    { message: '수업(student_id) 또는 메모(title) 중 하나는 필수입니다' }
  ),
  repeatCount: z.number().int().min(1).max(52, '반복 횟수는 최대 52주입니다'),
})
