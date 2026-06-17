// PassageLab — app/api/sources/route.ts
// "Find verified sources" — queries free scholarly APIs (OpenAlex, Crossref,
// Google Books) for REAL works on a passage and returns them formatted in
// Turabian/SBL/MLA. No Anthropic tokens are used, so this costs no API money.
// Results are cached in Supabase (30-day TTL) and rate-limited per IP.

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { findSources } from '@/lib/scholar-search'
import { getCachedSources, setCachedSources } from '@/lib/cache'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!rateLimit(`sources:${clientIp(req.headers)}`, 20, 5 * 60_000)) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many source lookups. Please wait a moment.' },
      { status: 429 }
    )
  }

  let passage: unknown
  try {
    ({ passage } = await req.json())
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  if (!passage || typeof passage !== 'string') {
    return NextResponse.json({ error: 'Passage is required' }, { status: 400 })
  }

  try {
    const cached = await getCachedSources(passage)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    const results = await findSources(passage)
    // Only cache non-empty results so a transient upstream outage isn't frozen
    // in the cache for 30 days.
    if (results.articles.length || results.books.length) {
      setCachedSources(passage, results as unknown as Record<string, unknown>).catch(() => {})
    }
    return NextResponse.json({ ...results, cached: false })
  } catch (err: any) {
    console.error('Source search error:', err?.message || err)
    return NextResponse.json(
      { error: 'search_failed', message: 'Could not fetch sources right now. Please try again.' },
      { status: 500 }
    )
  }
}
