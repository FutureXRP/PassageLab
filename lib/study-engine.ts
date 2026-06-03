import Anthropic from '@anthropic-ai/sdk'
import { PROMPT_PART_1, PROMPT_PART_2 } from './prompts'
import type { StudyData } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 6000

function extractJSON(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')
  try {
    return JSON.parse(match[0])
  } catch (e) {
    // Try to find the largest valid JSON object
    const str = match[0]
    let depth = 0
    let end = 0
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') depth++
      if (str[i] === '}') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    return JSON.parse(str.slice(0, end + 1))
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
  const [part1, part2] = await Promise.all([
    callClaude(PROMPT_PART_1(passage)),
    callClaude(PROMPT_PART_2(passage)),
  ])

  return {
    ...(part1 as object),
    ...(part2 as object),
  } as StudyData
}
