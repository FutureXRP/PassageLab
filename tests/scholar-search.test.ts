import { describe, it, expect } from 'vitest'
import {
  deriveBook,
  splitName,
  formatCitation,
  fromCrossref,
  fromOpenAlex,
  fromGoogleBooks,
  dedupe,
  biblicalRelevanceScore,
  type ScholarSource,
} from '../lib/scholar-search'

describe('deriveBook', () => {
  it('keeps a leading book number', () => {
    expect(deriveBook('1 Corinthians 13')).toBe('1 Corinthians')
    expect(deriveBook('2 John 1:1')).toBe('2 John')
  })
  it('strips chapter/verse', () => {
    expect(deriveBook('Galatians 1:1-10')).toBe('Galatians')
    expect(deriveBook('Romans 8')).toBe('Romans')
  })
  it('handles multi-word books and bare books', () => {
    expect(deriveBook('Song of Songs 2')).toBe('Song of Songs')
    expect(deriveBook('Jude')).toBe('Jude')
  })
})

describe('splitName', () => {
  it('splits given/family on the last token', () => {
    expect(splitName('Gordon D. Fee')).toEqual({ family: 'Fee', given: 'Gordon D.' })
  })
  it('handles a single token', () => {
    expect(splitName('Augustine')).toEqual({ family: 'Augustine' })
  })
})

const article: ScholarSource = {
  type: 'article',
  authors: [{ family: 'Fee', given: 'Gordon D.' }],
  title: 'Pneuma and Eschatology',
  container: 'JBL',
  year: '1994',
  volume: '113',
  issue: '2',
  pages: '225-240',
  doi: '10.2307/3266676',
  origin: 'crossref',
}

const book: ScholarSource = {
  type: 'book',
  authors: [{ family: 'Moo', given: 'Douglas J.' }],
  title: 'The Epistle to the Romans',
  publisher: 'Eerdmans',
  place: 'Grand Rapids',
  year: '1996',
  origin: 'googlebooks',
}

describe('formatCitation — articles', () => {
  it('Turabian uses volume, no., (year): pages and the DOI', () => {
    const out = formatCitation(article, 'turabian')
    expect(out).toContain('Fee, Gordon D.')
    expect(out).toContain('"Pneuma and Eschatology."')
    expect(out).toContain('JBL 113, no. 2 (1994): 225-240')
    expect(out).toContain('https://doi.org/10.2307/3266676')
  })
  it('SBL drops the issue number', () => {
    expect(formatCitation(article, 'sbl')).toContain('JBL 113 (1994): 225-240')
  })
  it('MLA uses vol./no./pp.', () => {
    const out = formatCitation(article, 'mla')
    expect(out).toContain('vol. 113')
    expect(out).toContain('pp. 225-240')
  })
})

describe('formatCitation — books', () => {
  it('Turabian includes place: publisher, year', () => {
    expect(formatCitation(book, 'turabian')).toContain('Grand Rapids: Eerdmans, 1996')
  })
  it('MLA omits the place', () => {
    const out = formatCitation(book, 'mla')
    expect(out).toContain('Eerdmans, 1996')
    expect(out).not.toContain('Grand Rapids')
  })
})

describe('normalizers', () => {
  it('maps a Crossref journal article', () => {
    const s = fromCrossref({
      title: ['Justification in Galatians'],
      type: 'journal-article',
      'container-title': ['JTS'],
      author: [{ family: 'Smith', given: 'John' }],
      issued: { 'date-parts': [[2001]] },
      volume: '5', issue: '1', page: '10-20',
      DOI: '10.1/abc',
      'is-referenced-by-count': 12,
    })
    expect(s).toMatchObject({ type: 'article', title: 'Justification in Galatians', container: 'JTS', year: '2001', doi: '10.1/abc', origin: 'crossref' })
  })
  it('maps an OpenAlex work and strips the DOI URL', () => {
    const s = fromOpenAlex({
      title: 'Spirit in Paul',
      type: 'article',
      doi: 'https://doi.org/10.5/xyz',
      publication_year: 2010,
      authorships: [{ author: { display_name: 'James D. G. Dunn' } }],
      primary_location: { source: { display_name: 'NTS' } },
      biblio: { volume: '56', first_page: '1', last_page: '20' },
      cited_by_count: 99,
    })
    expect(s).toMatchObject({ doi: '10.5/xyz', container: 'NTS', citations: 99 })
    expect(s?.pages).toBe('1–20')
  })
  it('maps a Google Books volume', () => {
    const s = fromGoogleBooks({ volumeInfo: {
      title: 'Galatians', subtitle: 'A Commentary',
      authors: ['Martinus C. de Boer'], publisher: 'WJK', publishedDate: '2011-05-01',
      industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780664221232' }],
    } })
    expect(s).toMatchObject({ type: 'book', title: 'Galatians: A Commentary', publisher: 'WJK', year: '2011', isbn: '9780664221232' })
  })
})

describe('biblicalRelevanceScore', () => {
  // The reported bug: searching "1 Timothy 2:1-15" returned STEM papers merely
  // written by an author named Timothy. The score reads title/container only —
  // never authors — so such a paper scores 0 and is dropped (articles need ≥4).
  it('scores author-name collisions to zero (the "Timothy" bug)', () => {
    const stem: ScholarSource = {
      type: 'article',
      title: 'Advances in Antimicrobial Resistance',
      container: 'Nature Microbiology',
      authors: [{ family: 'Walsh', given: 'Timothy R.' }],
      origin: 'crossref',
    }
    expect(biblicalRelevanceScore(stem, '1 timothy')).toBe(0)
  })

  it('scores a real journal article on the passage as relevant', () => {
    const real: ScholarSource = {
      type: 'article',
      title: 'Silence and Submission in 1 Timothy 2:11-15',
      container: 'Journal for the Study of the New Testament',
      authors: [{ family: 'Marshall', given: 'I. Howard' }],
      origin: 'crossref',
    }
    expect(biblicalRelevanceScore(real, '1 timothy')).toBeGreaterThanOrEqual(4)
  })

  it('scores a commentary volume as relevant even without "1 Timothy" spelled out', () => {
    const book: ScholarSource = {
      type: 'book',
      title: 'The Pastoral Epistles: Timothy and Titus',
      publisher: 'Eerdmans',
      authors: [{ family: 'Mounce', given: 'William D.' }],
      origin: 'googlebooks',
    }
    // 'epistle' (strong) + 'timothy' (core word) clears the Google Books bar (≥2)
    expect(biblicalRelevanceScore(book, '1 timothy')).toBeGreaterThanOrEqual(2)
  })

  it('does not over-reward a bare ambiguous book word without context', () => {
    const ambiguous: ScholarSource = {
      type: 'article',
      title: 'The Fall of the Romans',
      container: 'Journal of Ancient History',
      authors: [{ family: 'Gibbon', given: 'Edward' }],
      origin: 'openalex',
    }
    // "romans" appears but with no biblical signal — below the article bar (4)
    expect(biblicalRelevanceScore(ambiguous, 'romans')).toBeLessThan(4)
  })
})

describe('dedupe', () => {
  it('collapses records sharing a DOI', () => {
    const out = dedupe([
      { ...article },
      { ...article, origin: 'openalex', container: 'JBL (dup)' },
    ])
    expect(out.length).toBe(1)
  })
})
