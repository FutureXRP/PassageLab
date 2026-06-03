import Anthropic from '@anthropic-ai/sdk'
import { PROMPT_PART_1, PROMPT_PART_2 } from './prompts'
import type { StudyData } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4000

function extractJSON(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')
  return JSON.parse(match[0])
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

/**
 * Generate a full study dossier for a given passage.
 * Makes two sequential Claude calls and merges the results.
 */
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
