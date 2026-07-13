export type CsvRow = {
  readonly name_ko: string
  readonly school: string
  readonly residence: string | null
  readonly grade: string | null
}

export type ParsedRow = CsvRow & {
  readonly isDuplicate: boolean
  readonly rowNumber: number
}

export type ParseResult = {
  readonly rows: readonly ParsedRow[]
  readonly errors: readonly string[]
}

const HEADER_ALIASES: Record<string, keyof CsvRow> = {
  '이름': 'name_ko',
  name: 'name_ko',
  name_ko: 'name_ko',
  '학교': 'school',
  school: 'school',
  '거주지': 'residence',
  residence: 'residence',
  '학년': 'grade',
  grade: 'grade',
}

/** Split a single CSV line, respecting double-quoted fields (with "" escape). */
export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Parse a student CSV against existing students to flag duplicates by
 * `${name_ko}::${school}`. Requires at minimum the 이름/학교 columns.
 */
export function parseStudentCsv(
  text: string,
  existingStudents: readonly { name_ko: string; school: string }[],
): ParseResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV 파일에 헤더와 최소 1행의 데이터가 필요합니다'] }
  }

  const headerFields = parseCsvLine(lines[0])
  const columnMap = new Map<number, keyof CsvRow>()

  for (let i = 0; i < headerFields.length; i++) {
    const normalized = headerFields[i].toLowerCase().trim()
    const mapped = HEADER_ALIASES[normalized]
    if (mapped) {
      columnMap.set(i, mapped)
    }
  }

  if (!Array.from(columnMap.values()).includes('name_ko')) {
    return { rows: [], errors: ['이름(name) 컬럼을 찾을 수 없습니다'] }
  }
  if (!Array.from(columnMap.values()).includes('school')) {
    return { rows: [], errors: ['학교(school) 컬럼을 찾을 수 없습니다'] }
  }

  const existingSet = new Set(
    existingStudents.map((s) => `${s.name_ko}::${s.school}`),
  )

  const rows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    const row: Record<string, string | null> = {
      name_ko: '',
      school: '',
      residence: null,
      grade: null,
    }

    for (const [colIdx, fieldName] of columnMap.entries()) {
      const value = fields[colIdx]?.trim() ?? ''
      row[fieldName] = value || null
    }

    if (!row.name_ko) {
      errors.push(`${i + 1}행: 이름이 비어있습니다`)
      continue
    }
    if (!row.school) {
      errors.push(`${i + 1}행: 학교가 비어있습니다`)
      continue
    }

    const isDuplicate = existingSet.has(`${row.name_ko}::${row.school}`)

    rows.push({
      name_ko: row.name_ko as string,
      school: row.school as string,
      residence: row.residence,
      grade: row.grade,
      isDuplicate,
      rowNumber: i + 1,
    })
  }

  return { rows, errors }
}
