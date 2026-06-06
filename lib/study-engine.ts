import Anthropic from '@anthropic-ai/sdk'
import { PROMPT_PART_1, PROMPT_PART_2 } from './prompts'
import type { StudyData } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 16000

function extractJSON(raw: string): unknown {
  const cleaned = raw
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')

  const str = match[0]

  try {
    return JSON.parse(str)
  } catch {
    // Find the largest valid JSON object by tracking braces
    let depth = 0
    let end = 0
    let inString = false
    let escape = false

    for (let i = 0; i < str.length; i++) {
      const ch = str[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inString) { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      if (ch === '}') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }

    const candidate = str.slice(0, end + 1)
    try {
      return JSON.parse(candidate)
    } catch (e2) {
      throw new Error(`Could not parse JSON from response: ${String(e2).slice(0, 100)}`)
    }
  }
}

async function callClaude(prompt: string): Promise<unknown> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  return extractJSON(text)
}

export async function generateStudy(passage: string): Promise<StudyData> {
  const part1 = await callClaude(PROMPT_PART_1(passage))
  const part2 = await callClaude(PROMPT_PART_2(passage))

  return {
    ...(part1 as object),
    ...(part2 as object),
  } as StudyData
}
