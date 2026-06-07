// PassageLab — affiliate-links.ts
// Affiliate link builders for Amazon, Logos, Christianbook
// Sign up at:
//   Amazon Associates:  https://affiliate-program.amazon.com
//   Logos:              https://www.logos.com/affiliate
//   Christianbook:      https://www.christianbook.com/page/affiliate

// ─── Your affiliate tags ───────────────────────────────────────────────────
// Replace these with your actual affiliate IDs after signing up

const AMAZON_TAG = 'passagelab-20'        // Amazon Associates tag
const LOGOS_REF  = 'passagelab'           // Logos referral code
const CBD_AFF    = 'passagelab'           // Christianbook affiliate ID

// ─── Link builders ─────────────────────────────────────────────────────────

export function amazonSearchLink(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.amazon.com/s?k=${encoded}&tag=${AMAZON_TAG}`
}

export function amazonIsbnLink(isbn: string): string {
  // Strip hyphens from ISBN
  const clean = isbn.replace(/-/g, '')
  return `https://www.amazon.com/dp/${clean}?tag=${AMAZON_TAG}`
}

export function logosSearchLink(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.logos.com/search#q=${encoded}&ref=${LOGOS_REF}`
}

export function logosProductLink(productId: string): string {
  return `https://www.logos.com/product/${productId}?ref=${LOGOS_REF}`
}

export function cbdSearchLink(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.christianbook.com/page/search?q=${encoded}&af=${CBD_AFF}`
}

export function cbdIsbnLink(isbn: string): string {
  const clean = isbn.replace(/-/g, '')
  return `https://www.christianbook.com/page/search?q=${clean}&af=${CBD_AFF}`
}

export function googleScholarLink(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://scholar.google.com/scholar?q=${encoded}`
}

export function jstorLink(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.jstor.org/action/doBasicSearch?Query=${encoded}`
}

export function atlaLink(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.atla.com/research-tool/atlas/?q=${encoded}`
}

// ─── Build complete link set for a book ───────────────────────────────────

export interface BookLinks {
  amazon: string
  logos: string
  cbd: string
  googleScholar: string
}

export function buildBookLinks(
  title: string,
  author: string,
  isbn?: string
): BookLinks {
  const query = `${author} ${title}`

  return {
    amazon:       isbn ? amazonIsbnLink(isbn) : amazonSearchLink(query),
    logos:        logosSearchLink(query),
    cbd:          isbn ? cbdIsbnLink(isbn) : cbdSearchLink(query),
    googleScholar: googleScholarLink(query),
  }
}

// ─── Free resource links (always verified, no affiliate) ──────────────────

export const FREE_RESOURCES = {
  bibleHub: (passage: string) =>
    `https://biblehub.com/${encodeURIComponent(passage.toLowerCase().replace(/\s+/g, '/').replace(':', '/'))}.htm`,

  blueLetterBible: (passage: string) =>
    `https://www.blueletterbible.org/search/preSearch.cfm?Criteria=${encodeURIComponent(passage)}`,

  bibleGateway: (passage: string, translation = 'ESV') =>
    `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=${translation}`,

  ccel: () => 'https://www.ccel.org',

  ccelFathers: () => 'https://www.ccel.org/fathers.html',

  josephusWars: () => 'https://www.ccel.org/j/josephus/works/war.htm',

  josephusAntiquities: () => 'https://www.ccel.org/j/josephus/works/ant.htm',

  perseus: () => 'https://www.perseus.tufts.edu/hopper/',

  jstor: (query: string) => jstorLink(query),

  googleScholar: (query: string) => googleScholarLink(query),
}

// ─── Citation format helpers ───────────────────────────────────────────────

export interface CitationData {
  authorLast: string
  authorFirst: string
  title: string
  publisher: string
  location: string
  year: string
  series?: string
  edition?: string
  isbn?: string
  verified: boolean
}

export function formatTurabian(c: CitationData): string {
  const author = `${c.authorLast}, ${c.authorFirst}`
  const series = c.series ? ` ${c.series}.` : ''
  const edition = c.edition ? ` ${c.edition} ed.` : ''
  return `${author}. ${c.title}.${series}${edition} ${c.location}: ${c.publisher}, ${c.year}.`
}

export function formatSBL(c: CitationData): string {
  const author = `${c.authorFirst} ${c.authorLast}`
  const series = c.series ? ` ${c.series}` : ''
  const edition = c.edition ? `, ${c.edition} ed.` : ''
  return `${author}, ${c.title}${series} (${c.location}: ${c.publisher}, ${c.year}${edition}).`
}

export function formatMLA(c: CitationData): string {
  const author = `${c.authorLast}, ${c.authorFirst}`
  const edition = c.edition ? `, ${c.edition} ed.` : ''
  return `${author}. ${c.title}${edition}. ${c.publisher}, ${c.year}.`
}