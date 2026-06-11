// PassageLab — app/api/tab/route.ts
// Single-tab on-demand generation with Anthropic prompt caching + Haiku routing

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
  getUnlockStatus,
  recordUsageEvent,
} from '@/lib/usage'
import { getAuthUser } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { parseModelJson } from '@/lib/json-repair'

// Long Sonnet generations (Apologetics, Theology, Commentary) can exceed
// 60s under load — give the function room, and cap the upstream call so
// SDK retries can't blow through the budget
export const maxDuration = 120

// Prompt caching is GA — cached tokens cost 90% less than regular input tokens
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 100_000,
  maxRetries: 1,
})

const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'

// Cost per 1K tokens — cache_read is 90% cheaper than regular input
const COSTS = {
  sonnet: { input: 0.003,   output: 0.015,   cache_write: 0.00375, cache_read: 0.0003  },
  haiku:  { input: 0.00025, output: 0.00125, cache_write: 0.0003,  cache_read: 0.00003 },
}

function estimateCost(
  model: 'sonnet' | 'haiku',
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0
): number {
  const c = COSTS[model]
  // usage.input_tokens already EXCLUDES cache reads/writes — they are
  // reported in separate fields, so no subtraction here
  return (
    (inputTokens      * c.input       / 1000) +
    (outputTokens     * c.output      / 1000) +
    (cacheReadTokens  * c.cache_read  / 1000) +
    (cacheWriteTokens * c.cache_write / 1000)
  )
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit (per IP) ───────────────────────────────────────────────
    if (!rateLimit(`tab:${clientIp(req.headers)}`, 30, 5 * 60_000)) {
      return NextResponse.json({
        error:   'rate_limited',
        message: 'Too many requests. Please wait a few minutes and try again.',
      }, { status: 429 })
    }

    const body = await req.json()
    const { passage, roles, tabId } = body

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

    // ── Paywall enforcement (server-side) ─────────────────────────────────
    // Overview is free and anonymous. Every other tab requires a signed-in
    // user with a recorded unlock (written by /api/checkout) for this
    // passage at the right tier. The user comes from the session cookie —
    // never from the request body.
    const user = await getAuthUser()
    const userId = user?.id || null

    if (tabId !== 'overview') {
      if (!userId) {
        return NextResponse.json({
          error:   'auth_required',
          message: 'Please sign in to generate this tab.',
        }, { status: 401 })
      }
      const unlocks = await getUnlockStatus(userId, passage)
      const entitled = isDeepTab(tabId) ? unlocks.deep : unlocks.quick
      if (!entitled) {
        return NextResponse.json({
          error:   'payment_required',
          message: isDeepTab(tabId)
            ? 'Unlock the Deep Dive to generate this tab.'
            : 'Unlock the Quick Study to generate this tab.',
        }, { status: 402 })
      }
    }

    // ── Supabase cache check ──────────────────────────────────────────────
    const cached = await getCachedTab(passage, roles, tabId)
    if (cached) {
      incrementCacheHit(passage, roles, tabId).catch(() => {})
      if (userId) {
        // amount 0 — the billable charge is the unlock event from
        // /api/checkout; per-tab events are analytics only
        recordUsageEvent({
          userId, passage, roles, tabIds: [tabId],
          studyType, amount: 0,
          cached: true, inputTokens: 0, outputTokens: 0, apiCostEstimate: 0,
        }).catch(() => {})
      }
      // The scripture tab renders the raw passage text — include it on cache hits too
      let cachedBibleOut: Record<string, string> | null = null
      if (tabId === 'scripture') {
        cachedBibleOut = await getCachedBibleText(passage)
        if (!cachedBibleOut) {
          try { cachedBibleOut = (await fetchPassageText(passage)) as unknown as Record<string, string> } catch {}
        }
      }
      return NextResponse.json({
        tabId, data: cached, cached: true, price: studyPrice,
        ...(cachedBibleOut ? { bibleText: cachedBibleOut } : {}),
      })
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

    // ── Bible text for caching ────────────────────────────────────────────
    // The KJV text is the primary passage reference injected into prompts
    const bibleBlock = bibleText.kjv
      ? `Passage: "${passage}"\nText (KJV): ${bibleText.kjv}`
      : `Passage: "${passage}"`

    // ── API call with prompt caching ──────────────────────────────────────
    // cache_control marks blocks that Anthropic should cache between calls.
    // The system prompt and Bible text are identical across all tabs in a
    // study session — marking them ephemeral caches them for ~5 minutes,
    // saving 90% on those input tokens for every subsequent tab call.
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        }
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              // Bible text block — cached across all tabs for this passage
              type: 'text',
              text: bibleBlock,
              cache_control: { type: 'ephemeral' },
            },
            {
              // Tab-specific prompt — NOT cached (unique per tab)
              type: 'text',
              text: tabPrompt,
            }
          ]
        }
      ],
    })

    // ── Check for truncation ──────────────────────────────────────────────
    const truncated = response.stop_reason === 'max_tokens'
    if (truncated) {
      console.warn(`Tab ${tabId} hit max_tokens — attempting recovery. Tokens: ${response.usage.output_tokens}`)
    }

    // ── Parse response ────────────────────────────────────────────────────
    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    let parsed: Record<string, unknown>
    try {
      parsed = parseModelJson(cleaned)
    } catch {
      console.error(`Parse error on tab ${tabId}. Truncated: ${truncated}. Raw first 800 chars:`)
      console.error(rawText.slice(0, 800))
      return NextResponse.json({
        error:   'parse_error',
        message: truncated
          ? 'Response was too long and got cut off. Try a shorter passage.'
          : 'Failed to parse AI response. Please try again.',
      }, { status: 500 })
    }

    // ── Usage tracking ────────────────────────────────────────────────────
    const usage           = response.usage as any
    const inputTokens     = usage.input_tokens     || 0
    const outputTokens    = usage.output_tokens    || 0
    const cacheReadTokens = usage.cache_read_input_tokens  || 0
    const cacheWriteTokens= usage.cache_creation_input_tokens || 0
    const apiCost         = estimateCost(modelKey, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens)

    if (userId) {
      // amount 0 — billing happens at unlock time via /api/checkout
      recordUsageEvent({
        userId, passage, roles, tabIds: [tabId],
        studyType, amount: 0,
        cached: false, inputTokens, outputTokens, apiCostEstimate: apiCost,
      }).catch(() => {})
    }

    // ── Write to Supabase cache ───────────────────────────────────────────
    setCachedTab(passage, roles, tabId, parsed).catch(() => {})

    // ── Return ────────────────────────────────────────────────────────────
    return NextResponse.json({
      tabId,
      data:   parsed,
      cached: false,
      price:  studyPrice,
      ...(tabId === 'scripture' && bibleText.kjv ? { bibleText } : {}),
      meta: {
        model,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheWriteTokens,
        apiCost,
        promptCachingActive: cacheReadTokens > 0 || cacheWriteTokens > 0,
      },
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
