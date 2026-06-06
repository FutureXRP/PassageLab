import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt, getTabsForRoles, Role } from './prompts'
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

    try {
      return JSON.parse(str.slice(0, end + 1))
    } catch (e2) {
      throw new Error(`Could not parse JSON: ${String(e2).slice(0, 100)}`)
    }
  }
}

async function callClaude(prompt: string): Promise<unknown> {
  if (!prompt) return {}

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

export async function generateStudy(
  passage: string,
  roles: Role[]
): Promise<StudyData> {
  const tabs = getTabsForRoles(roles)

  const prompt1 = buildPrompt(passage, tabs, 1)
  const prompt2 = buildPrompt(passage, tabs, 2)

  const part1 = await callClaude(prompt1)
  const part2 = prompt2 ? await callClaude(prompt2) : {}

  return {
    ...(part1 as object),
    ...(part2 as object),
    roles,
    tabs,
  } as unknown as StudyData
}