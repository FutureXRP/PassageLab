import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTabPrompt, getTabsForRoles, Role } from '@/lib/prompts'
import { fetchPassageText } from '@/lib/bible-api'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const MODEL = 'claude-sonnet-4-6'

// Tabs that need more tokens due to output size
const HIGH_TOKEN_TABS = new Set(['language', 'commentary', 'manuscript', 'fathers'])
const STANDARD_TOKENS = 4000
const HIGH_TOKENS = 8000

// Process tabs in batches, heavy tabs get their own call
const BATCH_SIZE = 3

async function generateTab(tabId: string, passage: string): Promise<string> {
  const prompt = buildTabPrompt(tabId, passage)
  if (!prompt) return '{}'
  
  const maxTokens = HIGH_TOKEN_TABS.has(tabId) ? HIGH_TOKENS : STANDARD_TOKENS
  
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
  
  // Use brace-counting to find largest valid JSON
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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'init', tabs, roles: finalRoles, passage })}\n\n`))

        // Fetch bible text immediately in parallel
        const biblePromise = fetchPassageText(passage)

        // Separate heavy tabs from light tabs
        const heavyTabs = tabs.filter(t => HIGH_TOKEN_TABS.has(t))
        const lightTabs = tabs.filter(t => !HIGH_TOKEN_TABS.has(t))

        // Process light tabs in batches of 3
        for (let i = 0; i < lightTabs.length; i += BATCH_SIZE) {
          const batch = lightTabs.slice(i, i + BATCH_SIZE)
          
          // Signal all tabs in batch are generating
          for (const tabId of batch) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_start', tabId })}\n\n`))
          }
          
          const results = await Promise.all(
            batch.map(async (tabId) => {
              const result = await generateTab(tabId, passage)
              return { tabId, result }
            })
          )
          
          for (const { tabId, result } of results) {
            try {
              const parsed = JSON.parse(result)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_done', tabId, data: parsed })}\n\n`))
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_done', tabId, data: {} })}\n\n`))
            }
          }
        }

        // Send bible text when ready
        const bibleText = await biblePromise
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'bible', data: bibleText })}\n\n`))

        // Process heavy tabs one at a time to avoid token conflicts
        for (const tabId of heavyTabs) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_start', tabId })}\n\n`))
          const result = await generateTab(tabId, passage)
          try {
            const parsed = JSON.parse(result)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_done', tabId, data: parsed })}\n\n`))
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_done', tabId, data: {} })}\n\n`))
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed. Please try again.' })}\n\n`))
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