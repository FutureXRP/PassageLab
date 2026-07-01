// PassageLab — lib/json-repair.ts
// Parses model output into JSON, repairing truncated responses.
//
// When a response hits max_tokens it stops mid-structure — mid-string,
// mid-object, mid-array. Repair strategy: close any unterminated string,
// drop a dangling key/comma, then append the closers for every structure
// still open. If that fails, cut back to the previous element boundary and
// try again — losing the final (partial) element but salvaging the rest.

export function parseModelJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('No JSON object found')
  // Escape raw control characters that the model sometimes leaves unescaped
  // inside string values (literal newlines/tabs) — JSON.parse rejects those,
  // and it's the most common non-truncation failure. Safe: only characters
  // *inside* strings are touched, so structural whitespace is untouched.
  const str = escapeControlCharsInStrings(cleaned.slice(start))

  // 1. Direct parse
  try { return JSON.parse(str) } catch {}

  // 2. Complete object followed by trailing junk
  const lastBrace = str.lastIndexOf('}')
  if (lastBrace !== -1) {
    try { return JSON.parse(str.slice(0, lastBrace + 1)) } catch {}
  }

  // 3. Truncation repair, cutting back one element boundary per attempt
  let candidate = str
  for (let attempt = 0; attempt < 6; attempt++) {
    const repaired = closeOpenStructures(candidate)
    if (repaired !== null) return repaired

    // Drop the trailing partial element: cut at the last comma or closing
    // bracket and retry. (A comma inside prose can be a false boundary —
    // the next iteration just cuts further back.)
    const cutAt = Math.max(
      candidate.lastIndexOf(','),
      candidate.lastIndexOf('}'),
      candidate.lastIndexOf(']'),
    )
    if (cutAt <= 0) break
    candidate = candidate.slice(0, candidate[cutAt] === ',' ? cutAt : cutAt + 1)
  }

  throw new Error('Unable to repair truncated JSON')
}

// Escape JSON-illegal raw control characters (newlines, tabs, etc.) that
// appear inside string values. Characters outside strings — the whitespace
// between tokens — are left untouched so structure is preserved.
function escapeControlCharsInStrings(s: string): string {
  let out = ''
  let inString = false
  let escape = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escape)            { out += ch; escape = false; continue }
    if (ch === '\\')       { out += ch; if (inString) escape = true; continue }
    if (ch === '"')        { inString = !inString; out += ch; continue }
    if (inString && ch.charCodeAt(0) < 0x20) {
      out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t' : ' '
      continue
    }
    out += ch
  }
  return out
}

// ─── Graceful truncation trim (academic tabs) ────────────────────────────────
// parseModelJson salvages valid JSON from a truncated (max_tokens) response,
// but the final block still ends mid-sentence — the visible cut-off. This trims
// the trailing fragment of an academic document back to its last COMPLETE
// sentence so nothing renders cut off, without re-rolling the whole generation.

// Clean = ends on a real sentence terminator (. ! ?), optionally wrapped by
// closing quotes/brackets. Deliberately NOT ':' ';' or a lone quote — a
// trailing "…the following:" or an opening "The '" is a mid-thought fragment.
export const endsCleanSentence = (s: string): boolean =>
  /[.!?][)"'”’\]]*\s*$/.test((s || '').trim())

// Trim a string back to its last complete sentence (greedy — keeps everything
// through the right-most sentence terminator). Returns '' if none is found.
export function trimToLastSentence(s: string): string {
  const t = (s || '').trim()
  if (!t || endsCleanSentence(t)) return t
  const m = t.match(/^[\s\S]*[.!?][)"'”’\]]*(?=\s|$)/)
  return m ? m[0].trim() : ''
}

export function trimTruncatedAcademic(data: Record<string, unknown>): Record<string, unknown> {
  const academic = (data as { academic?: { blocks?: unknown[] } }).academic
  const blocks = academic?.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) return data

  const last = blocks[blocks.length - 1] as { paragraphs?: unknown[]; bullets?: unknown[] } | null
  if (last && typeof last === 'object') {
    // Drop/trim a trailing incomplete bullet
    if (Array.isArray(last.bullets) && last.bullets.length > 0) {
      const lb = String(last.bullets[last.bullets.length - 1] || '')
      if (lb && !endsCleanSentence(lb)) {
        const fixed = trimToLastSentence(lb)
        if (fixed) last.bullets[last.bullets.length - 1] = fixed
        else last.bullets.pop()
      }
    }
    // Trim the final paragraph back to its last complete sentence
    if (Array.isArray(last.paragraphs) && last.paragraphs.length > 0) {
      const fixed = trimToLastSentence(String(last.paragraphs[last.paragraphs.length - 1] || ''))
      if (fixed) last.paragraphs[last.paragraphs.length - 1] = fixed
      else last.paragraphs.pop()
    }
    // If the block lost all its prose, drop it entirely (but keep ≥1 block)
    const noProse   = !Array.isArray(last.paragraphs) || last.paragraphs.length === 0
    const noBullets = !Array.isArray(last.bullets)    || last.bullets.length === 0
    if (noProse && noBullets && blocks.length > 1) blocks.pop()
  }
  return data
}

function closeOpenStructures(s: string): Record<string, unknown> | null {
  const stack: string[] = []
  let inString = false
  let escape = false

  for (const ch of s) {
    if (escape)            { escape = false; continue }
    if (ch === '\\')       { if (inString) escape = true; continue }
    if (ch === '"')        { inString = !inString; continue }
    if (inString)          continue
    if (ch === '{' || ch === '[') stack.push(ch)
    else if (ch === '}' || ch === ']') stack.pop()
  }

  let candidate = s
  if (inString) candidate += '"'

  // Dangling separators: `"key":` gets a null value, trailing commas drop
  candidate = candidate.replace(/:\s*$/, ':null').replace(/,\s*$/, '')

  for (let i = stack.length - 1; i >= 0; i--) {
    candidate += stack[i] === '{' ? '}' : ']'
  }

  try {
    const parsed = JSON.parse(candidate)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}
