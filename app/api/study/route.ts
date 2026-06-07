import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTabPrompt, getTabsForRoles, Role } from '@/lib/prompts'
import { fetchPassageText } from '@/lib/bible-api'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const MODEL = 'claude-sonnet-4-6'

const BATCH_SIZE = 3

// Token budget by tab category — right-sized for actual content need
const TAB_TOKEN_LIMITS: Record<string, number> = {
  // Heavy research tabs
  language:    3000,
  commentary:  3000,
  manuscript:  2500,
  fathers:     2500,
  // Medium tabs
  theology:    2000,
  crossref:    2000,
  archaeology: 2000,
  christ:      2000,
  history:     2000,
  books:       1500,
  // Light tabs
  overview:    1200,
  scripture:   1000,
  outline:     1200,
  illustrations: 1500,
  smallgroup:  1500,
  youth:       1200,
  children:    1000,
  news:        1200,
}
const DEFAULT_TOKENS = 1500

// Scale token budget based on passage length
function getTokenBudget(tabId: string, verseCount: number): number {
  const base = TAB_TOKEN_LIMITS[tabId] ?? DEFAULT_TOKENS
  if (verseCount <= 3) return Math.round(base * 0.6)   // single verse / short
  if (verseCount <= 10) return Math.round(base * 0.85) // paragraph
  if (verseCount <= 30) return base                     // chapter section
  return Math.round(base * 1.2)                         // full chapter+
}

function estimateVerseCount(bibleText: Record<string, string>): number {
  // Use the KJV text if available, fall back to any translation
  const text = bibleText?.kjv || Object.values(bibleText || {})[0] || ''
  // Count verse markers — bible-api returns text with verse numbers inline
  const matches = text.match(/\d+\s+[A-Z]/g)
  if (matches && matches.length > 1) return matches.length
  // Fallback: rough word count / 30
  return Math.max(1, Math.round(text.split(/\s+/).length / 30))
}

const HIGH_TOKEN_TABS = new Set(['language', 'commentary', 'manuscript', 'fathers'])

async function generateTab(
  tabId: string,
  passage: string,
  bibleText: Record<string, string>,
  verseCount: number
): Promise<string> {
  const prompt = buildTabPrompt(tabId, passage, bibleText)
  if (!prompt) return '{}'

  const maxTokens = getTokenBudget(tabId, verseCount)

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('')

  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return '{}'

  const str = match[0]
  let depth = 0, end = 0, inString = false, escape = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') { depth--; if (depth === 0) { end = i; break } }
  }

  try { JSON.parse(str.slice(0, end + 1)); return str.slice(0, end + 1) }
  catch { return '{}' }
}

export async function POST(req: NextRequest) {
  const { passage, roles } = await req.json()

  const validRoles: Role[] = ['pastor','theologian','teacher','smallgroup','youth','children']
  const selectedRoles: Role[] = Array.isArray(roles)
    ? roles.filter((r: string) => validRoles.includes(r as Role)) as Role[]
    : ['pastor']
  const finalRoles = selectedRoles.length > 0 ? selectedRoles : ['pastor' as Role]
  const tabs = getTabsForRoles(finalRoles)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'init', tabs, roles: finalRoles, passage })}\n\n`
        ))

        // Fetch Bible text FIRST — needed for prompts and verse count
        const bibleText = await fetchPassageText(passage)
        const verseCount = estimateVerseCount(bibleText)

        // Send Bible text to frontend immediately
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'bible', data: bibleText })}\n\n`
        ))

        const heavyTabs = tabs.filter(t => HIGH_TOKEN_TABS.has(t))
        const lightTabs = tabs.filter(t => !HIGH_TOKEN_TABS.has(t))

        // Light tabs in parallel batches of 3
        for (let i = 0; i < lightTabs.length; i += BATCH_SIZE) {
          const batch = lightTabs.slice(i, i + BATCH_SIZE)

          for (const tabId of batch) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'tab_start', tabId })}\n\n`
            ))
          }

          const results = await Promise.all(
            batch.map(async (tabId) => {
              const result = await generateTab(tabId, passage, bibleText, verseCount)
              return { tabId, result }
            })
          )

          for (const { tabId, result } of results) {
            try {
              const parsed = JSON.parse(result)
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'tab_done', tabId, data: parsed })}\n\n`
              ))
            } catch {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'tab_done', tabId, data: {} })}\n\n`
              ))
            }
          }
        }

        // Heavy tabs sequentially
        for (const tabId of heavyTabs) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'tab_start', tabId })}\n\n`
          ))
          const result = await generateTab(tabId, passage, bibleText, verseCount)
          try {
            const parsed = JSON.parse(result)
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'tab_done', tabId, data: parsed })}\n\n`
            ))
          } catch {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'tab_done', tabId, data: {} })}\n\n`
            ))
          }
        }

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'complete' })}\n\n`
        ))
      } catch (err) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: 'Generation failed. Please try again.' })}\n\n`
        ))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
