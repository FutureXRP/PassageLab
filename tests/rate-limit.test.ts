import { describe, it, expect } from 'vitest'
import { rateLimit, clientIp } from '../lib/rate-limit'

describe('rateLimit', () => {
  it('allows up to the limit, then blocks', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000)).toBe(true)
    }
    expect(rateLimit(key, 5, 60_000)).toBe(false)
  })

  it('keys are independent', () => {
    const a = `a-${Math.random()}`
    const b = `b-${Math.random()}`
    expect(rateLimit(a, 1, 60_000)).toBe(true)
    expect(rateLimit(a, 1, 60_000)).toBe(false)
    expect(rateLimit(b, 1, 60_000)).toBe(true)
  })

  it('window expiry frees the bucket', async () => {
    const key = `exp-${Math.random()}`
    expect(rateLimit(key, 1, 10)).toBe(true)
    expect(rateLimit(key, 1, 10)).toBe(false)
    await new Promise(r => setTimeout(r, 20))
    expect(rateLimit(key, 1, 10)).toBe(true)
  })
})

describe('clientIp', () => {
  it('takes the first x-forwarded-for entry', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(clientIp(h)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip then unknown', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
