import { describe, it, expect } from 'vitest'
import { parseModelJson, trimToLastSentence, trimTruncatedAcademic } from '../lib/json-repair'

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

describe('trimToLastSentence', () => {
  it('leaves an already-complete sentence untouched', () => {
    expect(trimToLastSentence('A full thought.')).toBe('A full thought.')
  })

  it('drops a trailing fragment back to the last complete sentence', () => {
    // Mirrors the reported cut-off: "...Mounce, Knight. (4) The '"
    const cut = "So, broadly, Mounce, Knight. (4) The '"
    expect(trimToLastSentence(cut)).toBe('So, broadly, Mounce, Knight.')
  })

  it('returns empty string when there is no complete sentence', () => {
    expect(trimToLastSentence('σωθήσεται δὲ διὰ τῆς τεκνογονίας (sōthēsetai de')).toBe('')
  })
})

describe('trimTruncatedAcademic', () => {
  it('trims the final block paragraph to its last complete sentence', () => {
    const data = {
      academic: {
        blocks: [
          { heading: 'Grounds', paragraphs: ['Adam was first formed, then Eve.'] },
          { heading: 'v. 15', paragraphs: ["The reading is disputed. (4) The '"] },
        ],
      },
    }
    const out = trimTruncatedAcademic(data) as any
    expect(out.academic.blocks).toHaveLength(2)
    expect(out.academic.blocks[1].paragraphs[0]).toBe('The reading is disputed.')
  })

  it('drops the trailing block when it is only a mid-sentence fragment', () => {
    const data = {
      academic: {
        blocks: [
          { heading: 'Digest', paragraphs: ['A complete first block.'] },
          { heading: 'Cut', paragraphs: ['σωθήσεται δὲ διὰ τῆς τεκνογονίας (sōthēsetai de'] },
        ],
      },
    }
    const out = trimTruncatedAcademic(data) as any
    expect(out.academic.blocks).toHaveLength(1)
    expect(out.academic.blocks[0].heading).toBe('Digest')
  })

  it('leaves a clean, complete document unchanged', () => {
    const data = {
      academic: {
        blocks: [
          { heading: 'A', paragraphs: ['First.'] },
          { heading: 'B', paragraphs: ['Second sentence here.'] },
        ],
      },
    }
    const out = trimTruncatedAcademic(structuredClone(data)) as any
    expect(out).toEqual(data)
  })

  it('never removes the only block, even if it is a fragment', () => {
    const data = { academic: { blocks: [{ heading: 'Only', paragraphs: ['cut off mid'] }] } }
    const out = trimTruncatedAcademic(data) as any
    expect(out.academic.blocks).toHaveLength(1)
  })
})
