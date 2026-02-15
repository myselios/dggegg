import { z } from 'zod'

const ibCourseSchema = z.enum(['Ab initio', 'SL', 'HL', 'IGCSE', 'MYP', '기타'])
const studentStatusSchema = z.enum(['active', 'paused', 'ended'])

export const studentInsertSchema = z.object({
  name_ko: z.string().min(1, '한국어 이름은 필수입니다').max(100),
  grade: z.string().max(50).nullable().default(null),
  school: z.string().min(1, '학교는 필수입니다').max(200),
  ib_course: ibCourseSchema.nullable().default(null),
  current_score: z.number().int().min(1).max(45).nullable().default(null),
  weakness_areas: z.array(z.string()).nullable().default(null),
  residence: z.string().max(200).nullable().default(null),
  contact_parent: z.string().max(200).nullable().default(null),
  status: studentStatusSchema.optional(),
  color: z.string().max(50).nullable().default(null),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
  memo: z.string().nullable().default(null),
})

export const studentUpdateSchema = studentInsertSchema.partial()
