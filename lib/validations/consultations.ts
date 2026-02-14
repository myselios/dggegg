import { z } from 'zod'
import { uuidSchema, datetimeSchema } from './common'

const consultationTypeSchema = z.enum(['consultation', 'complaint', 'request', 'notice'])

export const consultationLogInsertSchema = z.object({
  student_id: uuidSchema,
  event_id: uuidSchema.nullable().default(null),
  type: consultationTypeSchema,
  content: z.string().min(1, '내용은 필수입니다'),
  tags: z.array(z.string()).nullable().default(null),
  date: datetimeSchema,
})
