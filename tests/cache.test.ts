import { describe, it, expect } from 'vitest'
import { normalizePassage, normalizeRoles, buildCacheKey } from '../lib/cache'

describe('normalizePassage', () => {
  it('lowercases and trims', () => {
    expect(normalizePassage('  John 3:16 ')).toBe('john 3:16')
  })

  it('collapses internal whitespace', () => {
    expect(normalizePassage('Romans   8:1-11')).toBe('romans 8:1-11')
  })

  it('normalizes spaced colons and dashes', () => {
    expect(normalizePassage('John 3 : 16')).toBe('john 3:16')
    expect(normalizePassage('Romans 8:1 - 11')).toBe('romans 8:1-11')
  })

  it('produces identical keys for equivalent inputs', () => {
    expect(normalizePassage('JOHN 3 : 16')).toBe(normalizePassage('john 3:16'))
  })
})

describe('normalizeRoles', () => {
  it('sorts roles so order does not change the key', () => {
    expect(normalizeRoles(['theologian', 'pastor'])).toBe('pastor+theologian')
    expect(normalizeRoles(['pastor', 'theologian'])).toBe('pastor+theologian')
  })

  it('does not mutate the input array', () => {
    const roles = ['theologian', 'pastor']
    normalizeRoles(roles)
    expect(roles).toEqual(['theologian', 'pastor'])
  })
})

describe('buildCacheKey', () => {
  it('combines passage, roles, and tab', () => {
    expect(buildCacheKey('John 3:16', ['pastor'], 'overview'))
      .toBe('john 3:16::pastor::overview')
  })
})
