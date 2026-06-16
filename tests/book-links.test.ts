import { describe, it, expect } from 'vitest'
import {
  isbn13ToIsbn10,
  buildAmazonUrl,
  pickIsbn13FromGoogle,
  normalizeForMatch,
} from '../lib/book-links'
import { bookKey } from '../lib/book-catalog'

describe('isbn13ToIsbn10', () => {
  it('converts a 978-prefixed ISBN-13 to ISBN-10', () => {
    expect(isbn13ToIsbn10('9780306406157')).toBe('0306406152')
  })

  it('ignores hyphens and spaces', () => {
    expect(isbn13ToIsbn10('978-0-306-40615-7')).toBe('0306406152')
  })

  it('produces an X check digit when required', () => {
    expect(isbn13ToIsbn10('9780802138255')).toBe('080213825X')
  })

  it('returns null for 979-prefixed ISBN-13 (no ISBN-10 equivalent)', () => {
    expect(isbn13ToIsbn10('9791234567896')).toBeNull()
  })

  it('returns null for malformed input', () => {
    expect(isbn13ToIsbn10('garbage')).toBeNull()
    expect(isbn13ToIsbn10('123')).toBeNull()
  })
})

describe('buildAmazonUrl', () => {
  it('builds a canonical /dp link from a 978 ISBN-13', () => {
    expect(buildAmazonUrl('9780306406157')).toBe('https://www.amazon.com/dp/0306406152')
  })

  it('appends an affiliate tag when given', () => {
    expect(buildAmazonUrl('9780306406157', 'passagelab-20')).toBe(
      'https://www.amazon.com/dp/0306406152?tag=passagelab-20'
    )
  })

  it('falls back to a keyword search for 979 ISBN-13s', () => {
    const url = buildAmazonUrl('9791234567896', 'passagelab-20')!
    expect(url).toContain('https://www.amazon.com/s?k=9791234567896')
    expect(url).toContain('tag=passagelab-20')
  })

  it('returns null when there is no usable identifier', () => {
    expect(buildAmazonUrl('123')).toBeNull()
  })
})

describe('pickIsbn13FromGoogle', () => {
  const items = [
    {
      volumeInfo: {
        title: 'The Cross of Christ',
        authors: ['John R. W. Stott'],
        industryIdentifiers: [
          { type: 'ISBN_10', identifier: '0830833188' },
          { type: 'ISBN_13', identifier: '9780830833207' },
        ],
      },
    },
  ]

  it('returns the ISBN-13 when title and author match', () => {
    expect(pickIsbn13FromGoogle('The Cross of Christ', 'John Stott', items)?.isbn13).toBe(
      '9780830833207'
    )
  })

  it('returns null when the title does not match', () => {
    expect(pickIsbn13FromGoogle('Systematic Theology', 'John Stott', items)).toBeNull()
  })

  it('returns null when the author does not match', () => {
    expect(pickIsbn13FromGoogle('The Cross of Christ', 'Wayne Grudem', items)).toBeNull()
  })

  it('matches on title alone when the model gave no author', () => {
    expect(pickIsbn13FromGoogle('The Cross of Christ', '', items)?.isbn13).toBe('9780830833207')
  })

  it('skips volumes without an ISBN-13 and picks the next match', () => {
    const mixed = [
      { volumeInfo: { title: 'The Cross of Christ', authors: ['John Stott'], industryIdentifiers: [{ type: 'ISBN_10', identifier: '0830833188' }] } },
      ...items,
    ]
    expect(pickIsbn13FromGoogle('The Cross of Christ', 'John Stott', mixed)?.isbn13).toBe(
      '9780830833207'
    )
  })

  it('returns null on empty input', () => {
    expect(pickIsbn13FromGoogle('The Cross of Christ', 'John Stott', [])).toBeNull()
    expect(pickIsbn13FromGoogle('The Cross of Christ', 'John Stott', null)).toBeNull()
  })
})

describe('normalizeForMatch', () => {
  it('lowercases, strips punctuation, and collapses whitespace', () => {
    expect(normalizeForMatch('  The Cross  of Christ! ')).toBe('the cross of christ')
  })
})

describe('bookKey', () => {
  it('matches the SQL dedup key: trimmed, lowercased, whitespace-collapsed', () => {
    expect(bookKey('  The   Cross of Christ ', 'John  Stott')).toBe('the cross of christ|john stott')
  })

  it('handles a missing author', () => {
    expect(bookKey('Knowing God', '')).toBe('knowing god|')
  })
})
