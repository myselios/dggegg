import { z } from 'zod'

export const uuidSchema = z.string().uuid('유효한 UUID가 아닙니다')

export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  '날짜 형식은 YYYY-MM-DD여야 합니다'
)

export const datetimeSchema = z.string().datetime({ message: '유효한 ISO 8601 날짜 형식이 아닙니다' })
