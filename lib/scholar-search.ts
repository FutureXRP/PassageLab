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

// ─── Relevance: keep biblical scholarship, drop name/topic collisions ─────────
// The old code sent the raw passage ("1 Timothy 2:1-15") straight to OpenAlex /
// Crossref, which index mostly non-biblical scholarship — so "Timothy" matched
// the personal NAME and returned STEM papers by authors named Timothy. Two
// fixes: (1) search a biblical-studies-scoped query instead of the raw passage,
// and (2) score every result for biblical relevance and drop the noise.

const NT_BOOKS = new Set([
  'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1 corinthians', '2 corinthians',
  'galatians', 'ephesians', 'philippians', 'colossians', '1 thessalonians', '2 thessalonians',
  '1 timothy', '2 timothy', 'titus', 'philemon', 'hebrews', 'james', '1 peter', '2 peter',
  '1 john', '2 john', '3 john', 'jude', 'revelation',
])
const OT_BOOKS = new Set([
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth',
  '1 samuel', '2 samuel', '1 kings', '2 kings', '1 chronicles', '2 chronicles', 'ezra',
  'nehemiah', 'esther', 'job', 'psalm', 'psalms', 'proverbs', 'ecclesiastes',
  'song of solomon', 'song of songs', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel',
  'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk',
  'zephaniah', 'haggai', 'zechariah', 'malachi',
])

// Biblical-studies context appended to the raw book name so the free APIs return
// commentaries / exegesis rather than papers by an author who happens to share a
// name with the book. Testament-specific where the book can be classified.
function biblicalContextTerms(bookLc: string): string {
  const terms = ['commentary', 'exegesis', 'biblical']
  if (NT_BOOKS.has(bookLc)) terms.push('New Testament')
  else if (OT_BOOKS.has(bookLc)) terms.push('Old Testament')
  return terms.join(' ')
}

// Known biblical-studies journals / commentary series. A container or publisher
// match is a strong, on-its-own-sufficient signal of relevance.
const BIBLICAL_VENUES = [
  'journal of biblical literature', 'new testament studies', 'novum testamentum',
  'catholic biblical quarterly', 'journal for the study of the new testament',
  'journal for the study of the old testament', 'vetus testamentum', 'tyndale bulletin',
  'biblica', 'journal of theological studies', 'harvard theological review',
  'neutestamentliche wissenschaft', 'alttestamentliche wissenschaft', 'expository times',
  'currents in biblical research', 'bulletin for biblical research',
  'westminster theological journal', 'evangelical theological society', 'biblical interpretation',
  'review of biblical literature', 'word biblical commentary', 'new international commentary',
  'anchor bible', 'anchor yale', 'hermeneia', 'sacra pagina', 'pillar new testament',
  'international critical commentary', 'baker exegetical', 'zondervan exegetical',
  'scottish journal of theology', 'bibliotheca sacra', 'trinity journal',
  'biblical theology bulletin', 'catholic biblical', 'ex auditu',
]

// Terms that strongly indicate biblical / theological scholarship.
const STRONG_SIGNALS = [
  'exeges', 'hermeneut', 'septuagint', 'epistle', 'gospel', 'pentateuch', 'pauline',
  'synoptic', 'messian', 'patristic', 'midrash', 'qumran', 'testament', 'scriptur',
  'apocalyp', 'eschatolog', 'soteriolog', 'christolog', 'ecclesiolog', 'pericope',
  'deutero', 'intertestamental', 'apostolic',
]

// Weaker biblical terms — need a companion signal (for articles) to count.
const GENERIC_SIGNALS = ['bible', 'biblical', 'commentary', 'commentaries', 'theolog', 'divinity']

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Score a source for biblical-studies relevance. The haystack is title +
// container + publisher only — deliberately NOT the authors — so a paper merely
// written by someone named "Timothy" scores nothing for the book 1 Timothy.
export function biblicalRelevanceScore(s: ScholarSource, bookLc: string): number {
  const hay = `${s.title || ''} ${s.container || ''} ${s.publisher || ''}`.toLowerCase()
  if (!hay.trim()) return 0
  const container = `${s.container || ''} ${s.publisher || ''}`.toLowerCase()

  let score = 0
  if (BIBLICAL_VENUES.some(v => container.includes(v))) score += 5

  // "<Book> <number>" in the title is a scripture-citation form ("Romans 5",
  // "1 Timothy 2", "John 3") that non-biblical work essentially never uses.
  const bookPat = esc(bookLc).replace(/\s+/g, '\\s+')
  if (new RegExp(`\\b${bookPat}\\s*\\.?\\s*\\d`, 'i').test(hay)) score += 5

  if (STRONG_SIGNALS.some(t => hay.includes(t))) score += 3
  if (GENERIC_SIGNALS.some(t => hay.includes(t))) score += 2

  // Full book phrase incl. any leading number ("1 timothy"), plus the bare core
  // word ("timothy") — both title/container-only, so still name-collision-safe.
  if (new RegExp(`\\b${bookPat}\\b`, 'i').test(hay)) score += 2
  const core = bookLc.replace(/^[1-3]\s+/, '')
  if (core && core !== bookLc && new RegExp(`\\b${esc(core).replace(/\s+/g, '\\s+')}\\b`, 'i').test(hay)) {
    score += 2
  }
  return score
}

// Keep only sources with real biblical-studies relevance. Google Books results
// come from an already biblical-scoped query and are far less noisy, so they
// clear a lower bar; OpenAlex/Crossref (mostly non-biblical indexes) clear more.
function isBiblicallyRelevant(s: ScholarSource, bookLc: string): boolean {
  const threshold = s.origin === 'googlebooks' ? 2 : 4
  return biblicalRelevanceScore(s, bookLc) >= threshold
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
  u.searchParams.set('per_page', '25')
  u.searchParams.set('mailto', CONTACT)
  const j = await getJson(u.toString())
  return (j?.results || []).map(fromOpenAlex).filter(Boolean) as ScholarSource[]
}

async function searchCrossref(query: string): Promise<ScholarSource[]> {
  const u = new URL('https://api.crossref.org/works')
  u.searchParams.set('query', query)
  u.searchParams.set('rows', '25')
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
  const bookLc = book.toLowerCase()

  // Search a biblical-studies-scoped query — NOT the raw passage. Sending
  // "1 Timothy 2:1-15" verbatim made "Timothy" match a personal name and
  // returned STEM papers; "1 Timothy commentary exegesis biblical New Testament"
  // returns actual scholarship on the book.
  const articleQuery = `${book} ${biblicalContextTerms(bookLc)}`.trim()

  const [oa, cr, gb] = await Promise.allSettled([
    searchOpenAlex(articleQuery),
    searchCrossref(articleQuery),
    searchGoogleBooks(`${book} bible commentary`),
  ])
  const all: ScholarSource[] = [
    ...(oa.status === 'fulfilled' ? oa.value : []),
    ...(cr.status === 'fulfilled' ? cr.value : []),
    ...(gb.status === 'fulfilled' ? gb.value : []),
  ]

  // Drop name/topic collisions (the "Timothy" STEM noise) before ranking.
  const deduped = dedupe(all.filter(s => isBiblicallyRelevant(s, bookLc)))
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
