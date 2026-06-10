'use client'

// PassageLab — app/global-error.tsx
// Last-resort error boundary — catches errors thrown by the root layout itself.
// Must render its own <html> and <body>.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0D1117', color: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#C9973A', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'Georgia, serif' }}>
          500 — Server Error
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, marginBottom: 14, lineHeight: 1.2 }}>
          PassageLab is temporarily unavailable
        </h1>
        <p style={{ fontSize: 15, color: '#8892A4', marginBottom: 36, maxWidth: 440, lineHeight: 1.7 }}>
          Something went wrong on our end. Please try again in a moment.
          {error?.digest && (
            <span style={{ display: 'block', marginTop: 10, fontSize: 12 }}>
              Error reference: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          style={{ background: '#C9973A', color: '#0D1117', border: 'none', borderRadius: 8, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
