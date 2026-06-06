import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTabPrompt, getTabsForRoles, Role } from '@/lib/prompts'
import { fetchPassageText } from '@/lib/bible-api'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4000

async function generateTab(tabId: string, passage: string): Promise<string> {
  const prompt = buildTabPrompt(tabId, passage)
  if (!prompt) return '{}'
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('')
  const match = text.replace(/```json/g, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
  if (!match) return '{}'
  try { JSON.parse(match[0]); return match[0] }
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
        // Send initial metadata
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'init', tabs, roles: finalRoles, passage })}\n\n`))

        // Fetch bible text immediately
        const bibleText = await fetchPassageText(passage)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'bible', data: bibleText })}\n\n`))

        // Generate tabs in batches of 3 to avoid rate limits
        const BATCH_SIZE = 3
        for (let i = 0; i < tabs.length; i += BATCH_SIZE) {
          const batch = tabs.slice(i, i + BATCH_SIZE)
          const results = await Promise.all(
            batch.map(async (tabId) => {
              // Signal tab is generating
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_start', tabId })}\n\n`))
              const result = await generateTab(tabId, passage)
              return { tabId, result }
            })
          )
          // Send completed tabs
          for (const { tabId, result } of results) {
            try {
              const parsed = JSON.parse(result)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_done', tabId, data: parsed })}\n\n`))
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tab_done', tabId, data: {} })}\n\n`))
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed' })}\n\n`))
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