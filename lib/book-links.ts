// PassageLab — book-links.ts
// Pure helpers for verifying book recommendations against a real catalog
// (Google Books) and turning a confirmed ISBN into a purchase link.
//
// Everything here except lookupIsbnOnGoogleBooks is pure and unit-tested
// (tests/book-links.test.ts). The verification job (app/api/verify-books)
// composes these; the serve-time link enrichment lives in lib/book-catalog.ts.

// ─── Matching ──────────────────────────────────────────────────────────────

// Normalize a title/author for fuzzy comparison: lowercase, strip accents and
// punctuation, collapse whitespace.
export function normalizeForMatch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '') // drop combining diacritics
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type GoogleVolume = {
  volumeInfo?: {
    title?: string
    authors?: string[]
    industryIdentifiers?: { type?: string; identifier?: string }[]
  }
}

// Choose the best ISBN-13 from a set of Google Books volumes for a given
// model-recommended title/author. Requires BOTH a title match and (when the
// model gave an author) an author match, to keep false positives out — a wrong
// link is worse than no link.
export function pickIsbn13FromGoogle(
  modelTitle: string,
  modelAuthor: string,
  items: GoogleVolume[] | undefined | null
): { isbn13: string; matchedTitle: string } | null {
  const mt = normalizeForMatch(modelTitle)
  const ma = normalizeForMatch(modelAuthor)
  if (!mt) return null
  const maLast = ma.split(' ').filter(Boolean).pop() || '' // author surname token

  for (const item of items || []) {
    const vi = item?.volumeInfo || {}
    const vt = normalizeForMatch(vi.title || '')
    if (!vt) continue

    // Title: equal, or one contains the other (handles subtitle differences)
    const titleOk = vt === mt || vt.includes(mt) || mt.includes(vt)
    if (!titleOk) continue

    // Author: surname appears among the volume's authors. Skipped only when the
    // model gave no author at all.
    const authors = (vi.authors || []).map(normalizeForMatch).join(' | ')
    const authorOk = !ma || authors.includes(ma) || (maLast.length >= 3 && authors.includes(maLast))
    if (!authorOk) continue

    const id = (vi.industryIdentifiers || []).find(
      (x) => x?.type === 'ISBN_13' && /^[0-9]{13}$/.test(x.identifier || '')
    )
    if (id?.identifier) return { isbn13: id.identifier, matchedTitle: vi.title || modelTitle }
  }
  return null
}

// ─── ISBN + link building ────────────────────────────────────────────────────

// Convert a 978-prefixed ISBN-13 to its ISBN-10. Returns null for 979-prefixed
// ISBN-13s (no ISBN-10 equivalent) or malformed input.
export function isbn13ToIsbn10(isbn13: string): string | null {
  const digits = (isbn13 || '').replace(/[^0-9]/g, '')
  if (digits.length !== 13 || !digits.startsWith('978')) return null
  const core = digits.slice(3, 12) // 9 significant digits
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(core[i], 10) * (10 - i)
  const check = (11 - (sum % 11)) % 11
  return core + (check === 10 ? 'X' : String(check))
}

// Build an Amazon product link from a verified ISBN-13. Prefers the canonical
// /dp/<ISBN-10> form (reliable now that the ISBN is confirmed); falls back to a
// keyword search for 979-prefixed ISBNs. Pass a tag to append an Associates id.
export function buildAmazonUrl(isbn13: string, tag?: string): string | null {
  const clean = (isbn13 || '').replace(/[^0-9Xx]/g, '')
  if (clean.length < 10) return null
  const isbn10 = isbn13ToIsbn10(clean)
  if (isbn10) {
    return `https://www.amazon.com/dp/${isbn10}` + (tag ? `?tag=${encodeURIComponent(tag)}` : '')
  }
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(clean)}`
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base
}

// ─── Google Books lookup (impure) ────────────────────────────────────────────

// Resolve a title/author to a canonical ISBN-13 via the Google Books API.
// The API key is optional (raises rate limits when present). Returns null when
// no confident match is found; throws on transport/HTTP errors so the caller
// can record an error rather than a "not found".
export async function lookupIsbnOnGoogleBooks(
  title: string,
  author: string,
  apiKey?: string
): Promise<{ isbn13: string; matchedTitle: string } | null> {
  const parts = [`intitle:${title}`]
  if (author && author.trim()) parts.push(`inauthor:${author}`)

  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', parts.join(' '))
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('printType', 'books')
  url.searchParams.set('country', 'US')
  if (apiKey) url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Google Books HTTP ${res.status}`)
  const json = (await res.json()) as { items?: GoogleVolume[] }
  return pickIsbn13FromGoogle(title, author, json.items || [])
}
