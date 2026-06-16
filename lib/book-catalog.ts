// PassageLab — book-catalog.ts
// Accumulates every book the Books tab recommends into a growing, dedup'd
// catalog (Supabase `book_catalog`). This is the raw material for a future
// verification pass: once an entry is authenticated against a real book
// catalog (ISBN, edition, canonical link), we can reintroduce accurate
// purchase links + affiliate revenue with confidence.
//
// Writes are best-effort and non-fatal — they must never block or fail a
// study response. Gracefully degrades to a no-op when Supabase is not
// configured, matching lib/cache.ts.

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { buildAmazonUrl } from './book-links'

// Normalized dedup key for a book — MUST match the SQL key built in the
// record_book_recommendations function (lower("title|author"), whitespace
// collapsed) so JS-side lookups line up with stored rows.
export function bookKey(title: string, author: string): string {
  const t = (title || '').trim()
  const a = (author || '').trim()
  return `${t}|${a}`.toLowerCase().replace(/\s+/g, ' ')
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

type RawBook = {
  title?:  unknown
  author?: unknown
  type?:   unknown
  isbn?:   unknown
  level?:  unknown
}

// Persist the books from a freshly generated Books tab. Dedup, counting, and
// passage accumulation happen server-side in the record_book_recommendations
// RPC (one round-trip, race-safe upsert).
export async function recordBookRecommendations(
  passage: string,
  books: unknown
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  if (!Array.isArray(books) || books.length === 0) return

  // Keep only catalog-relevant string fields; drop anything without a title.
  const clean = books
    .map((b) => {
      const book = (b ?? {}) as RawBook
      const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
      return {
        title:  str(book.title),
        author: str(book.author),
        type:   str(book.type),
        isbn:   str(book.isbn),
        level:  str(book.level),
      }
    })
    .filter((b) => b.title.length > 0)

  if (clean.length === 0) return

  try {
    await supabase.rpc('record_book_recommendations', {
      p_passage: passage,
      p_books:   clean,
    })
  } catch (err) {
    console.error('Book catalog write failed:', err)
  }
}

// ─── Verification worklist (used by /api/verify-books) ───────────────────────

export type UnverifiedBook = {
  id:     string
  title:  string
  author: string | null
  isbn:   string | null
}

// Pull the next batch to verify: unverified rows, most-recommended first,
// skipping anything checked within the last 30 days so permanently-unfindable
// titles don't get re-queried every run.
export async function getUnverifiedBooks(limit = 25): Promise<UnverifiedBook[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from('book_catalog')
      .select('id, title, author, isbn')
      .eq('verified', false)
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
      .order('recommend_count', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data as UnverifiedBook[]
  } catch {
    return []
  }
}

// Mark a row verified with its confirmed ISBN-13 and a canonical (untagged)
// purchase URL. The affiliate tag is appended later, at serve time.
export async function markBookVerified(
  id: string,
  canonicalIsbn: string,
  purchaseUrl: string | null
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const now = new Date().toISOString()
  try {
    await supabase
      .from('book_catalog')
      .update({
        verified:        true,
        verified_at:     now,
        canonical_isbn:  canonicalIsbn,
        purchase_url:    purchaseUrl,
        last_checked_at: now,
      })
      .eq('id', id)
  } catch (err) {
    console.error('Book verify update failed:', err)
  }
}

// Record that we looked and found nothing, so the 30-day backoff applies.
export async function markBookChecked(id: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase
      .from('book_catalog')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('id', id)
  } catch (err) {
    console.error('Book checked update failed:', err)
  }
}

// ─── Serve-time link enrichment (used by /api/tab) ───────────────────────────

// Given the books from a generated Books tab, attach a `purchase_url` to each
// one that already has a VERIFIED catalog row. The link is built fresh from the
// confirmed ISBN + current affiliate tag, so the cached study content stays
// link-free and verification lights up links retroactively everywhere.
// Best-effort: returns the input unchanged on any miss or error.
export async function attachVerifiedLinks<T extends Record<string, unknown>>(
  books: T[]
): Promise<T[]> {
  const supabase = getSupabase()
  if (!supabase || !Array.isArray(books) || books.length === 0) return books

  const keyOf = (b: T) => bookKey(String(b.title ?? ''), String(b.author ?? ''))
  const keys = Array.from(new Set(books.map(keyOf).filter((k) => k !== '|')))
  if (keys.length === 0) return books

  const tag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || undefined
  try {
    const { data } = await supabase
      .from('book_catalog')
      .select('book_key, canonical_isbn')
      .eq('verified', true)
      .in('book_key', keys)

    const links = new Map<string, string>()
    for (const row of data || []) {
      if (row.canonical_isbn) {
        const url = buildAmazonUrl(row.canonical_isbn, tag)
        if (url) links.set(row.book_key, url)
      }
    }
    if (links.size === 0) return books

    return books.map((b) => {
      const url = links.get(keyOf(b))
      return url ? { ...b, purchase_url: url } : b
    })
  } catch {
    return books
  }
}
