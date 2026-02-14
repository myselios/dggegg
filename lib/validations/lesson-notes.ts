import { z } from 'zod'
import { uuidSchema } from './common'

export const lessonNoteInsertSchema = z.object({
  event_id: uuidSchema,
  student_id: uuidSchema,
  content: z.string().nullable().default(null),
  homework: z.string().nullable().default(null),
  next_goal: z.string().nullable().default(null),
})
