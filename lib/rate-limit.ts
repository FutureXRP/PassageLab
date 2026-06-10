// PassageLab — lib/rate-limit.ts
// In-memory sliding-window rate limiter, keyed per IP (or any string).
//
// Serverless caveat: state is per-instance, so the effective limit is
// (limit × instance count). That still stops the cheap abuse case — a bot
// hammering one endpoint. For a hard global limit, swap this for a shared
// store (Upstash Redis / Vercel KV) behind the same function signature.

const buckets = new Map<string, number[]>()
const MAX_KEYS = 10_000

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs)

  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }

  hits.push(now)

  // Crude memory bound — reset everything rather than grow unbounded
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) buckets.clear()
  buckets.set(key, hits)
  return true
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
