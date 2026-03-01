import { GoogleGenerativeAI } from '@google/generative-ai'
import { serverEnv } from '@/lib/env'
import type { DocsSection } from '@/lib/google/docs'
import type { SessionSummary } from '@/lib/types/database'

const MODEL_NAME = 'gemini-2.0-flash'
const LOG_PREFIX = '[Gemini]'
const NO_API_KEY_MESSAGE = '[Gemini API 키가 설정되지 않았습니다]'

function buildPrompt(session: string, content: string): string {
  return `다음은 "${session}" 수업 내용입니다. 한국어로 3~5줄로 핵심 내용을 요약해주세요.\n\n${content}`
}

export async function summarizeContent(content: string, session: string): Promise<string> {
  const apiKey = serverEnv.GEMINI_API_KEY
  if (!apiKey) {
    return NO_API_KEY_MESSAGE
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    const prompt = buildPrompt(session, content)
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`${LOG_PREFIX} 요약 실패 (session: ${session}):`, message)
    return `[요약 실패: ${message}]`
  }
}

export async function summarizeSections(
  sections: readonly DocsSection[]
): Promise<readonly SessionSummary[]> {
  const summaries: SessionSummary[] = []

  for (const section of sections) {
    if (!section.content.trim()) continue

    const summary = await summarizeContent(section.content, section.session)
    summaries.push({ session: section.session, summary })
  }

  return summaries
}
