import { z } from 'zod'
import { uuidSchema, datetimeSchema } from './common'

const eventStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'no_show'])

export const scheduleEventInsertSchema = z.object({
  student_id: uuidSchema,
  start_at: datetimeSchema,
  end_at: datetimeSchema,
  status: eventStatusSchema,
  template_type: z.string().max(100).nullable().default(null),
  recurrence_rule: z.string().max(200).nullable().default(null),
  recurrence_group_id: z.string().uuid().nullable().default(null),
  color: z.string().max(50).nullable().default(null),
})

export const scheduleEventUpdateSchema = scheduleEventInsertSchema.partial()

export const recurringEventSchema = z.object({
  baseEvent: scheduleEventInsertSchema.omit({ recurrence_group_id: true }),
  repeatCount: z.number().int().min(1).max(52, '반복 횟수는 최대 52주입니다'),
})
