import { z } from 'zod'
import { uuidSchema, dateSchema } from './common'

export const scoreRecordInsertSchema = z.object({
  student_id: uuidSchema,
  event_id: uuidSchema.nullable().default(null),
  assessment_type: z.string().min(1, '평가 유형은 필수입니다').max(200),
  score: z.number().min(0).max(100).nullable().default(null),
  max_score: z.number().min(0).max(100),
  comment: z.string().nullable().default(null),
  date: dateSchema,
})
