// PassageLab — app/api/verify-books/route.ts
// Verification job for the book catalog. Works the most-recommended unverified
// books, resolves each to a canonical ISBN-13 via Google Books, and records the
// result. Verified rows get a confirmed ISBN + purchase URL; the Books tab then
// surfaces an accurate link for them (see lib/book-catalog.attachVerifiedLinks).
//
// Triggered by Vercel Cron (see vercel.json) or manually with the same secret:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        "https://<domain>/api/verify-books?limit=25"

import { NextRequest, NextResponse } from 'next/server'
import {
  getUnverifiedBooks,
  markBookVerified,
  markBookChecked,
} from '@/lib/book-catalog'
import { lookupIsbnOnGoogleBooks, buildAmazonUrl } from '@/lib/book-links'

export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

// Vercel Cron invokes endpoints with GET — delegate to the same handler.
export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  // ── Auth: cron secret only (same contract as /api/billing/charge) ────────
  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not set — refusing to run book verification')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Batch size (default 25, capped) ──────────────────────────────────────
  const limitParam = parseInt(new URL(req.url).searchParams.get('limit') || '25', 10)
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 25, 1), 100)

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY // optional — raises rate limits

  const books = await getUnverifiedBooks(limit)

  let verified = 0
  let notFound = 0
  let errors = 0
  const results: Array<Record<string, unknown>> = []

  for (const b of books) {
    try {
      const hit = await lookupIsbnOnGoogleBooks(b.title, b.author || '', apiKey)
      if (hit?.isbn13) {
        // Store the canonical (untagged) URL; the affiliate tag is appended at
        // serve time so it always reflects the current tag.
        const canonicalUrl = buildAmazonUrl(hit.isbn13)
        await markBookVerified(b.id, hit.isbn13, canonicalUrl)
        verified++
        results.push({ id: b.id, title: b.title, status: 'verified', isbn13: hit.isbn13 })
      } else {
        await markBookChecked(b.id)
        notFound++
        results.push({ id: b.id, title: b.title, status: 'not_found' })
      }
    } catch (err) {
      // Transport/HTTP error — leave the row alone so it's retried next run.
      errors++
      results.push({ id: b.id, title: b.title, status: 'error', error: (err as Error)?.message })
    }
    // Be polite to Google Books between calls.
    await new Promise((r) => setTimeout(r, 200))
  }

  return NextResponse.json({ checked: books.length, verified, notFound, errors, results })
}
