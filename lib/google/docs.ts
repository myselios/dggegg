import { google } from 'googleapis'
import { getAuthenticatedClient } from '@/lib/google/auth'

const DOCS_ID_REGEX = /\/document\/d\/([a-zA-Z0-9_-]+)\//
const SESSION_PATTERN = /([1-7]회차)/g
const LOG_PREFIX = '[Google Docs]'

export type DocsSection = { readonly session: string; readonly content: string }

export type DocsResult =
  | { readonly sections: readonly DocsSection[]; readonly error?: never }
  | { readonly error: string; readonly sections?: never }

function extractDocumentId(docsUrl: string): string | null {
  const match = DOCS_ID_REGEX.exec(docsUrl)
  return match ? match[1] : null
}

function extractTextFromDocument(document: { body?: { content?: unknown[] } }): string {
  const content = document.body?.content
  if (!content) return ''

  const segments: string[] = []

  for (const element of content) {
    const el = element as { paragraph?: { elements?: unknown[] } }
    if (!el.paragraph?.elements) continue

    for (const seg of el.paragraph.elements) {
      const segment = seg as { textRun?: { content?: string } }
      const text = segment.textRun?.content
      if (text) segments.push(text)
    }
  }

  return segments.join('')
}

function parseSections(text: string): readonly DocsSection[] {
  const matches = [...text.matchAll(SESSION_PATTERN)]
  if (matches.length === 0) {
    return [{ session: '전체', content: text.trim() }]
  }

  const sections: DocsSection[] = []

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const session = match[1]
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    const content = text.slice(start, end).trim()
    sections.push({ session, content })
  }

  return sections
}

export async function getDocsContent(docsUrl: string): Promise<DocsResult> {
  const documentId = extractDocumentId(docsUrl)
  if (!documentId) {
    return { error: '유효하지 않은 Google Docs URL입니다' }
  }

  let auth: Awaited<ReturnType<typeof getAuthenticatedClient>>
  try {
    auth = await getAuthenticatedClient()
  } catch (error) {
    console.error(`${LOG_PREFIX} 인증 클라이언트 획득 실패:`, error)
    return { error: 'Google 연동이 필요합니다' }
  }

  if (!auth) {
    return { error: 'Google 연동이 필요합니다' }
  }

  try {
    const docs = google.docs({ version: 'v1', auth })
    const response = await docs.documents.get({ documentId })
    const document = response.data

    const text = extractTextFromDocument(document as { body?: { content?: unknown[] } })
    const sections = parseSections(text)

    return { sections }
  } catch (error) {
    const statusCode =
      (error as { code?: number; status?: number }).code ??
      (error as { code?: number; status?: number }).status

    if (statusCode === 403 || statusCode === 404) {
      return { error: 'Google Docs 접근 권한이 없습니다' }
    }

    const message = error instanceof Error ? error.message : String(error)
    console.error(`${LOG_PREFIX} 문서 읽기 실패 (id: ${documentId}):`, message)
    return { error: `Google Docs 읽기 실패: ${message}` }
  }
}
