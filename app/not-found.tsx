// PassageLab — app/not-found.tsx
// Branded 404 page

import Link from 'next/link'

const SERIF     = "'Playfair Display', Georgia, serif"
const SANS      = "'DM Sans', system-ui, sans-serif"
const GOLD      = '#C9973A'
const PARCHMENT = '#F5F0E8'
const SLATE     = '#8892A4'
const INK       = '#0D1117'

export default function NotFound() {
  return (
    <div style={{ background: INK, minHeight: '100vh', color: PARCHMENT, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 13, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
        404 — Page Not Found
      </div>
      <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, marginBottom: 14, lineHeight: 1.2, maxWidth: 560 }}>
        This page doesn&apos;t exist
      </h1>
      <p style={{ fontSize: 15, color: SLATE, marginBottom: 36, maxWidth: 440, lineHeight: 1.7 }}>
        The page you&apos;re looking for may have moved. Head back home and
        enter a passage to start a new study.
      </p>
      <Link
        href="/"
        style={{ background: GOLD, color: INK, borderRadius: 8, padding: '13px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none', fontFamily: SANS }}
      >
        Back to home
      </Link>
    </div>
  )
}
