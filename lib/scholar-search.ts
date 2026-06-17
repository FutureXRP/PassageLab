// PassageLab — scholar-search.ts
// Finds REAL scholarly sources for a passage via free APIs (OpenAlex + Crossref
// for articles/works, Google Books for books) and formats the *real* returned
// metadata into Turabian/SBL/MLA. No LLM tokens are used — so this costs no
// Anthropic money — and because citations are built from real records, they
// are accurate, not hallucinated.
//
// Network calls run on the server (Vercel). All fetchers are best-effort: a
// failing API yields [] rather than throwing, so partial results still return.

const CONTACT = process.env.SOURCES_CONTACT_EMAIL || 'support@passagelab.app'
const FETCH_TIMEOUT_MS = 8000

export type Author = { family: string; given?: string }

export type ScholarSource = {
  type: 'article' | 'book' | 'chapter' | 'other'
  authors: Author[]
  title: string
  container?: string   // journal name, or book series
  publisher?: string
  place?: string
  year?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  isbn?: string
  url?: string
  citations?: number
  origin: 'openalex' | 'crossref' | 'googlebooks'
}

export type FormattedSource = ScholarSource & {
  turabian: string
  sbl: string
  mla: string
}

export type SourceResults = {
  query: string
  generatedAt: string
  articles: FormattedSource[]
  books: FormattedSource[]
}

// ─── Small helpers ───────────────────────────────────────────────────────────

const stripPeriod = (s: string) => s.replace(/\.\s*$/, '').trim()
const ensurePeriod = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : s.trim() + '.')
const bareDoi = (doi: string) => doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim()

// "Gordon D. Fee" → { given: "Gordon D.", family: "Fee" }
export function splitName(display: string): Author {
  const parts = (display || '').trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return { family: '' }
  if (parts.length === 1) return { family: parts[0] }
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') }
}

// Derive the book name from a reference, keeping a leading 1/2/3 ("1 Corinthians
// 13" → "1 Corinthians"; "Galatians 1:1-10" → "Galatians"; "Jude" → "Jude").
export function deriveBook(passage: string): string {
  const m = (passage || '').match(/^\s*((?:[1-3]\s+)?[A-Za-z][A-Za-z .]*?)\s+\d/)
  return (m ? m[1] : passage || '').trim()
}

function authorsChicago(authors: Author[]): string {
  const f1 = (a: Author) => (a.given ? `${a.family}, ${a.given}` : a.family)
  const fN = (a: Author) => (a.given ? `${a.given} ${a.family}` : a.family)
  const list = authors.filter(a => a.family)
  if (list.length === 0) return ''
  if (list.length === 1) return f1(list[0])
  if (list.length <= 3) {
    const rest = list.slice(1)
    return f1(list[0]) + rest.map((a, i) => (i === rest.length - 1 ? ', and ' : ', ') + fN(a)).join('')
  }
  return `${f1(list[0])} et al.`
}

function authorsMLA(authors: Author[]): string {
  const f1 = (a: Author) => (a.given ? `${a.family}, ${a.given}` : a.family)
  const fN = (a: Author) => (a.given ? `${a.given} ${a.family}` : a.family)
  const list = authors.filter(a => a.family)
  if (list.length === 0) return ''
  if (list.length === 1) return f1(list[0])
  if (list.length === 2) return `${f1(list[0])}, and ${fN(list[1])}`
  return `${f1(list[0])}, et al.`
}

// Build a citation string from REAL metadata. Plain text (no italics markup) —
// titles/journals should be italicized by the user when they paste it.
export function formatCitation(s: ScholarSource, style: 'turabian' | 'sbl' | 'mla'): string {
  const isBook = s.type === 'book'
  const authors = style === 'mla' ? authorsMLA(s.authors) : authorsChicago(s.authors)
  const A = authors ? ensurePeriod(authors) + ' ' : ''
  const title = s.title ? stripPeriod(s.title) : ''

  if (isBook) {
    const titlePart = title ? `${title}. ` : ''
    const pub = style === 'mla'
      ? [s.publisher, s.year].filter(Boolean).join(', ')
      : [[s.place, s.publisher].filter(Boolean).join(': '), s.year].filter(Boolean).join(', ')
    return (A + titlePart + (pub ? pub + '.' : '')).trim()
  }

  const titlePart = title ? `"${title}." ` : ''
  if (style === 'mla') {
    const bits = [
      s.container,
      s.volume ? `vol. ${s.volume}` : '',
      s.issue ? `no. ${s.issue}` : '',
      s.year,
      s.pages ? `pp. ${s.pages}` : '',
    ].filter(Boolean).join(', ')
    let out = (A + titlePart + (bits ? bits + '.' : '')).trim()
    if (s.doi) out += ` https://doi.org/${s.doi}.`
    return out
  }

  // turabian / sbl
  let tail = ''
  if (s.container) {
    tail += s.container
    if (style === 'turabian') {
      const vn = [s.volume, s.issue ? `no. ${s.issue}` : ''].filter(Boolean).join(', ')
      if (vn) tail += ` ${vn}`
    } else if (s.volume) {
      tail += ` ${s.volume}` // SBL typically uses volume without "no."
    }
    if (s.year) tail += ` (${s.year})`
    if (s.pages) tail += `: ${s.pages}`
    tail += '.'
  } else if (s.year) {
    tail += `${s.year}.`
  }
  let out = (A + titlePart + tail).trim()
  if (s.doi) out += ` https://doi.org/${s.doi}.`
  return out
}

export function withFormats(s: ScholarSource): FormattedSource {
  return { ...s, turabian: formatCitation(s, 'turabian'), sbl: formatCitation(s, 'sbl'), mla: formatCitation(s, 'mla') }
}

// ─── Normalizers (map raw API records → ScholarSource) ───────────────────────

export function fromOpenAlex(w: any): ScholarSource | null {
  if (!w?.title) return null
  const t = String(w.type || '')
  const type: ScholarSource['type'] = t === 'book' ? 'book' : t.includes('chapter') ? 'chapter' : 'article'
  const doi = w.doi ? bareDoi(String(w.doi)) : undefined
  return {
    type,
    authors: (w.authorships || []).map((a: any) => splitName(a?.author?.display_name || '')),
    title: String(w.title),
    container: w.primary_location?.source?.display_name || undefined,
    year: w.publication_year ? String(w.publication_year) : undefined,
    volume: w.biblio?.volume || undefined,
    issue: w.biblio?.issue || undefined,
    pages: w.biblio?.first_page ? [w.biblio.first_page, w.biblio.last_page].filter(Boolean).join('–') : undefined,
    doi,
    url: doi ? `https://doi.org/${doi}` : (w.primary_location?.landing_page_url || w.id || undefined),
    citations: w.cited_by_count || 0,
    origin: 'openalex',
  }
}

export function fromCrossref(it: any): ScholarSource | null {
  const title = (it?.title || [])[0]
  if (!title) return null
  const t = String(it.type || '')
  const type: ScholarSource['type'] = t.includes('book') && !t.includes('chapter') ? 'book' : t.includes('chapter') ? 'chapter' : 'article'
  const doi = it.DOI ? bareDoi(String(it.DOI)) : undefined
  return {
    type,
    authors: (it.author || []).map((a: any) => ({ family: a.family || a.name || '', given: a.given })),
    title: String(title),
    container: (it['container-title'] || [])[0] || undefined,
    publisher: it.publisher || undefined,
    year: it.issued?.['date-parts']?.[0]?.[0] ? String(it.issued['date-parts'][0][0]) : undefined,
    volume: it.volume || undefined,
    issue: it.issue || undefined,
    pages: it.page || undefined,
    doi,
    isbn: (it.ISBN || [])[0],
    url: it.URL || (doi ? `https://doi.org/${doi}` : undefined),
    citations: it['is-referenced-by-count'] || 0,
    origin: 'crossref',
  }
}

export function fromGoogleBooks(item: any): ScholarSource | null {
  const v = item?.volumeInfo
  if (!v?.title) return null
  const isbn = (v.industryIdentifiers || []).find((x: any) => x.type === 'ISBN_13')?.identifier
    || (v.industryIdentifiers || []).find((x: any) => x.type === 'ISBN_10')?.identifier
  return {
    type: 'book',
    authors: (v.authors || []).map((a: string) => splitName(a)),
    title: [v.title, v.subtitle].filter(Boolean).join(': '),
    publisher: v.publisher || undefined,
    year: (v.publishedDate || '').slice(0, 4) || undefined,
    isbn,
    url: v.canonicalVolumeLink || v.infoLink || undefined,
    origin: 'googlebooks',
  }
}

// ─── De-dupe + rank ──────────────────────────────────────────────────────────

const keyOf = (s: ScholarSource) =>
  (s.doi && `doi:${s.doi.toLowerCase()}`) ||
  (s.isbn && `isbn:${s.isbn.replace(/[^0-9Xx]/g, '')}`) ||
  `t:${s.title.toLowerCase().replace(/\s+/g, ' ').trim()}|${s.year || ''}`

export function dedupe(sources: ScholarSource[]): ScholarSource[] {
  const seen = new Map<string, ScholarSource>()
  for (const s of sources) {
    if (!s.title) continue
    const k = keyOf(s)
    const existing = seen.get(k)
    // Prefer the record with a DOI, then more metadata
    if (!existing || (!existing.doi && s.doi)) seen.set(k, s)
  }
  return [...seen.values()]
}

// ─── Fetchers (best-effort; [] on any failure) ──────────────────────────────

async function getJson(url: string): Promise<any | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function searchOpenAlex(query: string): Promise<ScholarSource[]> {
  const u = new URL('https://api.openalex.org/works')
  u.searchParams.set('search', query)
  u.searchParams.set('per_page', '20')
  u.searchParams.set('mailto', CONTACT)
  const j = await getJson(u.toString())
  return (j?.results || []).map(fromOpenAlex).filter(Boolean) as ScholarSource[]
}

async function searchCrossref(query: string): Promise<ScholarSource[]> {
  const u = new URL('https://api.crossref.org/works')
  u.searchParams.set('query', query)
  u.searchParams.set('rows', '20')
  u.searchParams.set('select', 'title,author,container-title,issued,volume,issue,page,DOI,ISBN,type,publisher,URL,is-referenced-by-count')
  u.searchParams.set('mailto', CONTACT)
  const j = await getJson(u.toString())
  return (j?.message?.items || []).map(fromCrossref).filter(Boolean) as ScholarSource[]
}

async function searchGoogleBooks(query: string): Promise<ScholarSource[]> {
  const u = new URL('https://www.googleapis.com/books/v1/volumes')
  u.searchParams.set('q', query)
  u.searchParams.set('maxResults', '15')
  u.searchParams.set('printType', 'books')
  u.searchParams.set('country', 'US')
  const key = process.env.GOOGLE_BOOKS_API_KEY
  if (key) u.searchParams.set('key', key)
  const j = await getJson(u.toString())
  return (j?.items || []).map(fromGoogleBooks).filter(Boolean) as ScholarSource[]
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export async function findSources(passage: string): Promise<SourceResults> {
  const ref = (passage || '').trim()
  const book = deriveBook(ref)

  const [oa, cr, gb] = await Promise.allSettled([
    searchOpenAlex(ref),
    searchCrossref(ref),
    searchGoogleBooks(`${book} commentary`),
  ])
  const all: ScholarSource[] = [
    ...(oa.status === 'fulfilled' ? oa.value : []),
    ...(cr.status === 'fulfilled' ? cr.value : []),
    ...(gb.status === 'fulfilled' ? gb.value : []),
  ]

  const deduped = dedupe(all)
  const articles = deduped
    .filter(s => s.type === 'article' || s.type === 'chapter')
    .sort((a, b) => (b.citations || 0) - (a.citations || 0) || Number(b.year || 0) - Number(a.year || 0))
    .slice(0, 18)
    .map(withFormats)
  const books = deduped
    .filter(s => s.type === 'book')
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
    .slice(0, 15)
    .map(withFormats)

  return { query: ref, generatedAt: new Date().toISOString(), articles, books }
}
