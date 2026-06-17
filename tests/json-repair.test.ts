import { describe, it, expect } from 'vitest'
import { parseModelJson } from '../lib/json-repair'

describe('parseModelJson', () => {
  it('parses clean JSON', () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 })
  })

  it('strips markdown fences and preamble', () => {
    expect(parseModelJson('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('drops trailing junk after a complete object', () => {
    expect(parseModelJson('{"a":1} and some commentary')).toEqual({ a: 1 })
  })

  it('repairs truncation mid-string', () => {
    const out = parseModelJson('{"archaeology":[{"discovery":"Tel Dan Stele","details":"An inscription that was cut off mid sent')
    expect(Array.isArray(out.archaeology)).toBe(true)
    expect((out.archaeology as any[])[0].discovery).toBe('Tel Dan Stele')
  })

  it('repairs truncation between elements (the Archaeology 500 case)', () => {
    const out = parseModelJson('{"archaeology":[{"discovery":"A","details":"done"},{"discovery":"B","details":"also done"},{"discovery":"C","det')
    const items = out.archaeology as any[]
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items[0].discovery).toBe('A')
    expect(items[1].discovery).toBe('B')
  })

  it('repairs truncation after a dangling key colon', () => {
    const out = parseModelJson('{"overview":{"summary":"Complete sentence.","main_idea":')
    expect((out.overview as any).summary).toBe('Complete sentence.')
  })

  it('repairs truncation after a trailing comma', () => {
    const out = parseModelJson('{"books":[{"title":"Commentary on Romans","author":"Moo"},')
    expect((out.books as any[])[0].title).toBe('Commentary on Romans')
  })

  it('handles escaped quotes inside strings', () => {
    const out = parseModelJson('{"quote":"He said \\"go\\" and then the response was trunc')
    expect(out.quote).toContain('He said')
  })

  it('escapes a raw newline inside a string (the completed-but-malformed case)', () => {
    // Model finished (not truncated) but left a literal newline in a value —
    // JSON.parse rejects this; the parser must escape it and recover.
    const out = parseModelJson('{"genre_rules":"First line.\nSecond line.","ok":true}')
    expect(out.ok).toBe(true)
    expect(out.genre_rules).toContain('First line.')
    expect(out.genre_rules).toContain('Second line.')
  })

  it('escapes raw tabs inside strings', () => {
    const out = parseModelJson('{"a":"x\ty"}')
    expect(out.a).toBe('x\ty')
  })

  it('throws when no object is present', () => {
    expect(() => parseModelJson('no json here at all')).toThrow()
  })
})
