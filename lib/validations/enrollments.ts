import { z } from 'zod'
import { uuidSchema, dateSchema } from './common'

const enrollmentStatusSchema = z.enum(['active', 'paused', 'ended'])

export const enrollmentInsertSchema = z.object({
  student_id: uuidSchema,
  start_date: dateSchema,
  end_date: dateSchema.nullable().default(null),
  sessions_per_week: z.number().int().min(1).max(14).nullable().default(null),
  lesson_type: z.string().min(1, '수업 형태는 필수입니다').max(50).default('1:1'),
  notes: z.string().max(2000).nullable().default(null),
  status: enrollmentStatusSchema.default('active'),
  total_sessions: z.number().int().min(1, '패키지 회차는 1 이상이어야 합니다').max(200).nullable().default(null),
  payment_note: z.string().max(500).nullable().default(null),
})

export const enrollmentUpdateSchema = enrollmentInsertSchema.partial()
