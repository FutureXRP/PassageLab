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
