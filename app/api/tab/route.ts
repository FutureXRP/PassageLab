// PassageLab — app/api/tab/route.ts
// Single-tab on-demand generation with Anthropic prompt caching + Haiku routing

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildTabPrompt,
  getTabModel,
  getTabTokens,
  isDeepTab,
  isAcademicTab,
  studyTypeForTab,
  getStudyPrice,
  SYSTEM_PROMPT,
} from '@/lib/prompts'
import { ACADEMIC_ENABLED } from '@/lib/flags'
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
  recordRenderFailure,
} from '@/lib/usage'
import { getAuthUser } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { parseModelJson, trimTruncatedAcademic } from '@/lib/json-repair'
import { recordBookRecommendations, attachVerifiedLinks } from '@/lib/book-catalog'

// Long Sonnet generations (Apologetics, Theology, Commentary) can exceed
// 60s under load — give the function room, and cap the upstream call so
// SDK retries can't blow through the budget
// Academic (Opus) tabs run long; give the function room. Haiku/Sonnet finish
// well within this regardless.
export const maxDuration = 300

// Prompt caching is GA — cached tokens cost 90% less than regular input tokens
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 100_000,
  maxRetries: 1,
})

const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'
const OPUS   = 'claude-opus-4-8'

// Cost per 1K tokens — cache_read is 90% cheaper than regular input
const COSTS = {
  opus:   { input: 0.005,   output: 0.025,   cache_write: 0.00625, cache_read: 0.0005  },
  sonnet: { input: 0.003,   output: 0.015,   cache_write: 0.00375, cache_read: 0.0003  },
  haiku:  { input: 0.00025, output: 0.00125, cache_write: 0.0003,  cache_read: 0.00003 },
}

function estimateCost(
  model: 'sonnet' | 'haiku' | 'opus',
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
  // Hoisted so the parse-error path and the catch block can record a render
  // failure for the affected (paid) study.
  let userId: string | null = null
  let passage = ''
  let roles: string[] = []
  let tabId = ''
  let studyType: 'quick' | 'deep' | 'academic' = 'quick'

  try {
    // ── Rate limit (per IP) ───────────────────────────────────────────────
    if (!rateLimit(`tab:${clientIp(req.headers)}`, 80, 5 * 60_000)) {
      return NextResponse.json({
        error:   'rate_limited',
        message: 'Too many requests. Please wait a few minutes and try again.',
      }, { status: 429 })
    }

    const body = await req.json()
    passage = body.passage
    roles   = body.roles
    tabId   = body.tabId

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

    studyType  = studyTypeForTab(tabId)
    const studyPrice = getStudyPrice([tabId])

    // Academic tier is feature-flagged. When OFF, academic tabs don't exist:
    // treat a request for one as an unknown tab so nothing about the tier leaks.
    if (isAcademicTab(tabId) && !ACADEMIC_ENABLED) {
      return NextResponse.json({ error: `Unknown tab: ${tabId}` }, { status: 400 })
    }

    // ── Paywall enforcement (server-side) ─────────────────────────────────
    // Overview is free and anonymous. Every other tab requires a signed-in
    // user with a recorded unlock (written by /api/checkout) for this
    // passage at the right tier. The user comes from the session cookie —
    // never from the request body.
    const user = await getAuthUser()
    userId = user?.id || null

    if (tabId !== 'overview') {
      if (!userId) {
        return NextResponse.json({
          error:   'auth_required',
          message: 'Please sign in to generate this tab.',
        }, { status: 401 })
      }
      const unlocks = await getUnlockStatus(userId, passage)
      const entitled = isAcademicTab(tabId)
        ? unlocks.academic
        : isDeepTab(tabId) ? unlocks.deep : unlocks.quick
      if (!entitled) {
        return NextResponse.json({
          error:   'payment_required',
          message: isAcademicTab(tabId)
            ? 'Unlock the Academic study to generate this tab.'
            : isDeepTab(tabId)
              ? 'Unlock the Deep Dive to generate this tab.'
              : 'Unlock the Quick Study to generate this tab.',
        }, { status: 402 })
      }
    }

    // ── Supabase cache check ──────────────────────────────────────────────
    // Academic entries are salted with a content version: entries cached
    // before the continuation fix could be truncated mid-sentence — salting
    // makes them miss so the tab regenerates complete.
    const cacheTabId = isAcademicTab(tabId) ? `${tabId}.v2` : tabId
    const cached = await getCachedTab(passage, roles, cacheTabId)
    if (cached) {
      incrementCacheHit(passage, roles, cacheTabId).catch(() => {})
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
      // Attach purchase links for any books that are verified in the catalog.
      // Done at serve time (not stored in cache) so links appear retroactively
      // as books get verified, without invalidating cached study content.
      const cachedData = tabId === 'books'
        ? { ...cached, books: await attachVerifiedLinks(((cached as { books?: unknown }).books as Record<string, unknown>[]) || []) }
        : cached

      return NextResponse.json({
        tabId, data: cachedData, cached: true, price: studyPrice,
        ...(cachedBibleOut ? { bibleText: cachedBibleOut } : {}),
      })
    }

    // ── Fetch Bible text ──────────────────────────────────────────────────
    let bibleText: Record<string, string> = {}
    let verseCount = 0
    const cachedBible = await getCachedBibleText(passage)
    if (cachedBible) {
      bibleText = cachedBible
      verseCount = Number(cachedBible.verseCount) || 0
    } else {
      try {
        const fetched = await fetchPassageText(passage)
        verseCount = fetched.verseCount
        bibleText = {
          kjv:        fetched.kjv,
          web:        fetched.web,
          asv:        fetched.asv,
          ylt:        fetched.ylt,
          reference:  fetched.reference,
          copyright:  fetched.copyright,
          // stringified so the cache-hit path can re-check the cap cheaply.
          // ScriptureTab reads named keys (kjv/web/...), so this never renders.
          verseCount: String(fetched.verseCount),
        }
        setCachedBibleText(passage, bibleText).catch(() => {})
      } catch {
        bibleText = {}
        verseCount = 0
      }
    }

    // ── Passage size guard ────────────────────────────────────────────────
    // Reject overly long passages BEFORE any paid model call, so the per-verse
    // tabs (Scripture especially) can never truncate or time out. The verse
    // count is exact (from bible-api). 0 means the reference wasn't fetchable —
    // we let those through (no verse list to enumerate = low truncation risk).
    const MAX_PASSAGE_VERSES = Number(process.env.MAX_PASSAGE_VERSES) || 40
    if (verseCount > MAX_PASSAGE_VERSES) {
      return NextResponse.json({
        error:   'passage_too_long',
        message: `That selection is ${verseCount} verses. PassageLab studies up to ${MAX_PASSAGE_VERSES} verses at a time — try a single chapter or a shorter section.`,
      }, { status: 400 })
    }

    // ── Build prompt ──────────────────────────────────────────────────────
    const tabPrompt = buildTabPrompt(tabId, passage, bibleText)
    if (!tabPrompt) {
      return NextResponse.json({ error: `Unknown tab: ${tabId}` }, { status: 400 })
    }

    // ── Model selection ───────────────────────────────────────────────────
    const modelKey  = getTabModel(tabId)
    const model     = modelKey === 'opus' ? OPUS : modelKey === 'sonnet' ? SONNET : HAIKU
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
    //
    // Completeness guarantee: a response that hits max_tokens is NOT shipped
    // as-is. The continuation loop resumes the model from exactly where it
    // stopped (assistant prefill), so a long section FINISHES instead of
    // ending mid-sentence — the end of a section is often its most important
    // part. Malformed JSON (non-truncation) still gets one re-roll. All calls
    // are time-budgeted to stay inside the function's 300s window; if the
    // budget runs out, the error path lets the client retry a fresh function.
    let response: Anthropic.Message | null = null
    let parsed:   Record<string, unknown> | null = null
    let truncated = false
    // Usage accumulated across every call (attempts + continuations)
    let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0

    const started = Date.now()
    const TIME_BUDGET_MS = 285_000        // maxDuration is 300s; keep headroom
    const remainingMs = () => TIME_BUDGET_MS - (Date.now() - started)

    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ]
    const userContent: Anthropic.TextBlockParam[] = [
      // Bible text block — cached across all tabs for this passage
      { type: 'text', text: bibleBlock, cache_control: { type: 'ephemeral' } },
      // Tab-specific prompt — NOT cached (unique per tab)
      { type: 'text', text: tabPrompt },
    ]
    const addUsage = (r: Anthropic.Message) => {
      const u = r.usage as any
      inputTokens      += u.input_tokens || 0
      outputTokens     += u.output_tokens || 0
      cacheReadTokens  += u.cache_read_input_tokens || 0
      cacheWriteTokens += u.cache_creation_input_tokens || 0
    }
    const textOf = (r: Anthropic.Message) =>
      r.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('')

    for (let attempt = 0; attempt < 2 && parsed === null; attempt++) {
      // A re-roll needs real time left — otherwise return the error and let
      // the client's auto-retry start a FRESH function with a full budget.
      if (attempt > 0 && remainingMs() < 60_000) break

      const tokens = attempt === 0
        ? maxTokens
        : Math.max(4096, Math.min(Math.ceil(maxTokens * 1.4), 9000))
      const callTimeout = Math.max(
        30_000,
        Math.min(modelKey === 'opus' ? 280_000 : 100_000, remainingMs() - 5_000)
      )

      response = await anthropic.messages.create({
        model,
        max_tokens: tokens,
        system: systemBlocks,
        messages: [{ role: 'user', content: userContent }],
      }, { timeout: callTimeout })
      addUsage(response)
      let rawText = textOf(response)

      // ── Continuation: never ship a cut-off section ──────────────────────
      // stop_reason 'max_tokens' means the model was cut mid-stream. Resume it
      // with its own partial output as an assistant prefill — it picks up at
      // the exact character it stopped on. Up to 2 rounds, time-permitting.
      let rounds = 0
      while (response.stop_reason === 'max_tokens' && rounds < 2 && remainingMs() > 45_000) {
        rounds++
        console.warn(`Tab ${tabId} hit max_tokens — continuation round ${rounds}`)
        const base = rawText.replace(/\s+$/, '')  // API rejects trailing whitespace in a prefill
        try {
          response = await anthropic.messages.create({
            model,
            max_tokens: modelKey === 'opus' ? 4000 : 2500,
            system: systemBlocks,
            messages: [
              { role: 'user', content: userContent },
              { role: 'assistant', content: base },   // prefill → continues in place
            ],
          }, { timeout: Math.max(30_000, Math.min(150_000, remainingMs() - 5_000)) })
          addUsage(response)
          rawText = base + textOf(response)
        } catch (contErr: any) {
          // A failed continuation must not discard the minutes of work already
          // done — keep the partial (truncated stays true → trimmed, uncached).
          console.error(`Continuation failed on tab ${tabId}:`, contErr?.message || contErr)
          break
        }
      }

      truncated = response.stop_reason === 'max_tokens'

      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
      try {
        parsed = parseModelJson(cleaned)
      } catch {
        console.error(`Parse error on tab ${tabId} (attempt ${attempt + 1}/2). Truncated: ${truncated}. First 800 chars:`)
        console.error(rawText.slice(0, 800))
        // parsed stays null → loop retries once, then falls through to the error
      }
    }

    if (parsed === null || response === null) {
      if (userId && tabId !== 'overview') {
        recordRenderFailure({
          userId, passage, roles, tabId, studyType,
          error: truncated ? 'Response truncated (max_tokens) — parse failed' : 'Failed to parse AI response',
        }).catch(() => {})
      }
      return NextResponse.json({
        error:   'parse_error',
        message: truncated
          ? 'Response was too long and got cut off. Try a shorter passage.'
          : 'Failed to parse AI response. Please try again.',
      }, { status: 500 })
    }

    // A parseable-but-truncated academic response ends mid-sentence — trim the
    // trailing fragment so the study never renders cut off. (Rare now that
    // budgets are sized to complete in one pass; this is the safety net.)
    if (truncated && isAcademicTab(tabId)) {
      console.warn(`Academic tab "${tabId}" hit max_tokens — trimming trailing fragment.`)
      parsed = trimTruncatedAcademic(parsed)
    }

    // ── Usage tracking ────────────────────────────────────────────────────
    // Token counts were accumulated across every call (incl. continuations)
    const apiCost = estimateCost(modelKey, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens)

    if (userId) {
      // amount 0 — billing happens at unlock time via /api/checkout
      recordUsageEvent({
        userId, passage, roles, tabIds: [tabId],
        studyType, amount: 0,
        cached: false, inputTokens, outputTokens, apiCostEstimate: apiCost,
      }).catch(() => {})
    }

    // ── Write to Supabase cache ───────────────────────────────────────────
    // Only COMPLETE content is cached. A still-truncated response (continuation
    // budget exhausted — rare) is served trimmed for this request but never
    // frozen into the cache, so the next attempt regenerates it in full.
    if (!truncated) {
      setCachedTab(passage, roles, cacheTabId, parsed).catch(() => {})
    }

    // ── Accumulate the book catalog ───────────────────────────────────────
    // Every freshly generated Books tab feeds the growing, dedup'd catalog
    // we'll later verify and (eventually) link + monetize. Fire-and-forget —
    // recorded only on fresh generation, since cache hits add no new books.
    let responseData: Record<string, unknown> = parsed
    if (tabId === 'books') {
      recordBookRecommendations(passage, (parsed as { books?: unknown }).books).catch(() => {})
      // Surface links for already-verified books (built fresh from the catalog,
      // not written back to cache).
      responseData = { ...parsed, books: await attachVerifiedLinks(((parsed as { books?: unknown }).books as Record<string, unknown>[]) || []) }
    }

    // ── Return ────────────────────────────────────────────────────────────
    return NextResponse.json({
      tabId,
      data:   responseData,
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

    if (userId && tabId && tabId !== 'overview') {
      recordRenderFailure({
        userId, passage, roles, tabId, studyType,
        error: String(err?.message || err),
      }).catch(() => {})
    }

    return NextResponse.json({
      error:   'generation_failed',
      message: 'Study generation failed. Please try again.',
    }, { status: 500 })
  }
}
