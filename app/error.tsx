'use client'

// PassageLab — app/error.tsx
// Catches runtime errors in any route segment and shows a branded 500 page

import { useEffect } from 'react'
import Link from 'next/link'

const SERIF     = "'Playfair Display', Georgia, serif"
const SANS      = "'DM Sans', system-ui, sans-serif"
const GOLD      = '#C9973A'
const PARCHMENT = '#F5F0E8'
const SLATE     = '#8892A4'
const INK       = '#0D1117'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div style={{ background: INK, minHeight: '100vh', color: PARCHMENT, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 13, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
        500 — Something went wrong
      </div>
      <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, marginBottom: 14, lineHeight: 1.2, maxWidth: 560 }}>
        We hit an unexpected error
      </h1>
      <p style={{ fontSize: 15, color: SLATE, marginBottom: 36, maxWidth: 440, lineHeight: 1.7 }}>
        Your study wasn&apos;t lost — completed tabs are saved on this device.
        Try again, or return home and restart your search.
        {error?.digest && (
          <span style={{ display: 'block', marginTop: 10, fontSize: 12 }}>
            Error reference: {error.digest}
          </span>
        )}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{ background: GOLD, color: INK, border: 'none', borderRadius: 8, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{ background: 'rgba(255,255,255,0.06)', color: PARCHMENT, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '13px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none', fontFamily: SANS }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
