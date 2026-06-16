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
