// PassageLab — app/api/tab/route.ts
// Single-tab on-demand generation with caching and Haiku routing

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildTabPrompt,
  getTabModel,
  getTabTokens,
  isDeepTab,
  getStudyPrice,
  SYSTEM_PROMPT,
} from '@/lib/prompts'
import { fetchPassageText } from '@/lib/bible-api'
import {
  getCachedTab,
  setCachedTab,
  getCachedBibleText,
  setCachedBibleText,
  incrementCacheHit,
} from '@/lib/cache'
import {
  checkSpendingLimit,
  recordUsageEvent,
} from '@/lib/usage'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'

// Cost estimates per 1K tokens (for internal tracking only)
const COSTS = {
  sonnet: { input: 0.003,   output: 0.015   },
  haiku:  { input: 0.00025, output: 0.00125 },
}

function estimateCost(
  model: 'sonnet' | 'haiku',
  inputTokens: number,
  outputTokens: number
): number {
  const c = COSTS[model]
  return (inputTokens * c.input / 1000) + (outputTokens * c.output / 1000)
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { passage, roles, tabId, userId } = body

    // ── Validate ──────────────────────────────────────────────────────────
    if (!passage || typeof passage !== 'string') {
      return NextResponse.json({ error: 'Passage is required' }, { status: 400 })
    }
    if (!tabId || typeof tabId !== 'string') {
      return NextResponse.json({ error: 'Tab ID is required' }, { status: 400 })
    }
    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'At least one role is required' }, { status: 400 })
    }

    const studyType  = isDeepTab(tabId) ? 'deep' : 'quick'
    const studyPrice = getStudyPrice([tabId])

    // ── Spending limit check ──────────────────────────────────────────────
    if (userId) {
      const limitCheck = await checkSpendingLimit(userId, studyPrice)
      if (!limitCheck.allowed) {
        return NextResponse.json({
          error:        'spending_limit_reached',
          message:      limitCheck.reason,
          currentSpend: limitCheck.currentSpend,
          limit:        limitCheck.limit,
        }, { status: 402 })
      }
    }

    // ── Cache check ───────────────────────────────────────────────────────
    const cached = await getCachedTab(passage, roles, tabId)
    if (cached) {
      incrementCacheHit(passage, roles, tabId).catch(() => {})
      if (userId) {
        recordUsageEvent({
          userId, passage, roles, tabIds: [tabId],
          studyType, amount: studyPrice,
          cached: true, inputTokens: 0, outputTokens: 0, apiCostEstimate: 0,
        }).catch(() => {})
      }
      return NextResponse.json({ tabId, data: cached, cached: true, price: studyPrice })
    }

    // ── Fetch Bible text ──────────────────────────────────────────────────
    let bibleText: Record<string, string> = {}
    const cachedBible = await getCachedBibleText(passage)
    if (cachedBible) {
      bibleText = cachedBible
    } else {
      try {
        const fetched = await fetchPassageText(passage)
        bibleText = {
          kjv:       fetched.kjv,
          web:       fetched.web,
          asv:       fetched.asv,
          ylt:       fetched.ylt,
          reference: fetched.reference,
          copyright: fetched.copyright,
        }
        setCachedBibleText(passage, bibleText).catch(() => {})
      } catch {
        bibleText = {}
      }
    }

    // ── Build prompt ──────────────────────────────────────────────────────
    const tabPrompt = buildTabPrompt(tabId, passage, bibleText)
    if (!tabPrompt) {
      return NextResponse.json({ error: `Unknown tab: ${tabId}` }, { status: 400 })
    }

    // ── Model selection ───────────────────────────────────────────────────
    const modelKey  = getTabModel(tabId)
    const model     = modelKey === 'sonnet' ? SONNET : HAIKU
    const maxTokens = getTabTokens(tabId)

    // ── API call ──────────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role:    'user',
          content: `${SYSTEM_PROMPT}\n\n${tabPrompt}`,
        }
      ],
    })

    // ── Check stop reason ─────────────────────────────────────────────────
    if (response.stop_reason === 'max_tokens') {
      console.warn(`Tab ${tabId} hit max_tokens limit — response may be truncated`)
    }

    // ── Parse response ────────────────────────────────────────────────────
    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    let parsed: Record<string, unknown>
    try {
      // Strategy 1: direct parse after cleanup
      const directAttempt = cleaned.startsWith('{') ? cleaned : cleaned.slice(cleaned.indexOf('{'))
      try {
        parsed = JSON.parse(directAttempt)
      } catch {
        // Strategy 2: find last } and try parsing the slice
        const start = cleaned.indexOf('{')
        const end   = cleaned.lastIndexOf('}')
        if (start === -1 || end === -1) throw new Error('No JSON object found')
        parsed = JSON.parse(cleaned.slice(start, end + 1))
      }
    } catch (parseErr) {
      console.error('Parse error. Raw response first 800 chars:')
      console.error(rawText.slice(0, 800))
      return NextResponse.json({
        error:   'parse_error',
        message: 'Failed to parse AI response. Please try again.',
        debug:   rawText.slice(0, 300),
      }, { status: 500 })
    }

    // ── Usage tracking ────────────────────────────────────────────────────
    const inputTokens  = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const apiCost      = estimateCost(modelKey, inputTokens, outputTokens)

    if (userId) {
      recordUsageEvent({
        userId, passage, roles, tabIds: [tabId],
        studyType, amount: studyPrice,
        cached: false, inputTokens, outputTokens, apiCostEstimate: apiCost,
      }).catch(() => {})
    }

    // ── Cache result ──────────────────────────────────────────────────────
    setCachedTab(passage, roles, tabId, parsed).catch(() => {})

    // ── Return ────────────────────────────────────────────────────────────
    return NextResponse.json({
      tabId,
      data:   parsed,
      cached: false,
      price:  studyPrice,
      meta: { model, inputTokens, outputTokens, apiCost },
    })

  } catch (err: any) {
    console.error('Tab generation error:', err?.message || err)

    if (err?.status === 429 || err?.status === 529) {
      return NextResponse.json({
        error:   'rate_limited',
        message: 'Servers are busy. Please try again in a moment.',
      }, { status: 429 })
    }

    return NextResponse.json({
      error:   'generation_failed',
      message: 'Study generation failed. Please try again.',
    }, { status: 500 })
  }
}