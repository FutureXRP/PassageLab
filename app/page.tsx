'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoMark } from '@/components/logo-mark'

const SERIF  = "'Playfair Display', Georgia, serif"
const SANS   = "'DM Sans', system-ui, sans-serif"
const GOLD   = '#C9973A'
const PARCHMENT = '#F5F0E8'
const SLATE  = '#8892A4'
const INK    = '#0D1117'

const ROLES = [
  { id: 'pastor',     label: 'Pastor',      desc: 'Sermon prep & preaching' },
  { id: 'theologian', label: 'Theologian',  desc: 'Systematic & biblical theology' },
  { id: 'teacher',    label: 'Teacher',     desc: 'Bible study & adult ed' },
  { id: 'smallgroup', label: 'Small Group', desc: 'Discussion & community' },
  { id: 'youth',      label: 'Youth',       desc: 'Youth ministry' },
  { id: 'children',   label: 'Children',    desc: "Children's ministry" },
  { id: 'student',    label: 'Student',     desc: 'Seminary & academic' },
]

const EXAMPLES = [
  'John 3:16', 'Romans 8:1-11', 'Psalm 23', 'Genesis 1:1-2:3',
  'Isaiah 53', 'Philippians 4:4-7', 'Hebrews 11', 'Judges 11:30-31',
]

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [passage, setPassage]     = useState('')
  const [roles, setRoles]         = useState<string[]>(['pastor'])
  const [error, setError]         = useState('')

  function toggleRole(id: string) {
    setRoles(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter(r => r !== id)
      }
      if (prev.length >= 2) return prev
      return [...prev, id]
    })
  }

  function handleSearch() {
    const p = passage.trim()
    if (!p) { setError('Enter a passage to study'); return }
    setError('')
    router.push(`/study/${encodeURIComponent(p)}?roles=${roles.join(',')}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={{ background: INK, minHeight: '100vh', color: PARCHMENT, fontFamily: SANS, display: 'flex', flexDirection: 'column' as const }}>

      {/* Nav */}
      <nav style={{ padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={30} />
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: PARCHMENT }}>
            Passage<span style={{ color: GOLD }}>Lab</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 12, color: SLATE }}>AI-powered biblical research for Bible teachers</div>
          <a href="/account" style={{ fontSize: 12, color: GOLD, textDecoration: 'none', border: '1px solid rgba(201,151,58,0.3)', borderRadius: 6, padding: '5px 14px' }}>Account</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>

        <div style={{ fontFamily: SERIF, fontSize: 13, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 16 }}>
          Biblical Research Platform
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 700, color: PARCHMENT, textAlign: 'center' as const, marginBottom: 14, lineHeight: 1.2, maxWidth: 640 }}>
          Deep study for every passage
        </h1>

        <p style={{ fontSize: 16, color: SLATE, textAlign: 'center' as const, marginBottom: 48, maxWidth: 480, lineHeight: 1.7 }}>
          Enter any passage. Choose your role. Get a complete study — Overview is always free.
        </p>

        {/* Search box */}
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={passage}
              onChange={e => setPassage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. John 3:16 or Romans 8:1-11"
              style={{
                flex:         1,
                background:   'rgba(255,255,255,0.06)',
                border:       `1px solid ${error ? '#F87171' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8,
                padding:      '14px 18px',
                fontSize:     16,
                color:        PARCHMENT,
                fontFamily:   SANS,
                outline:      'none',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background:   GOLD,
                color:        INK,
                border:       'none',
                borderRadius: 8,
                padding:      '14px 28px',
                fontSize:     15,
                fontWeight:   700,
                cursor:       'pointer',
                fontFamily:   SANS,
                whiteSpace:   'nowrap' as const,
              }}
            >
              Study →
            </button>
          </div>
          {error && <div style={{ fontSize: 13, color: '#F87171', marginTop: 8 }}>{error}</div>}
          {!error && <div style={{ fontSize: 12, color: SLATE, marginTop: 8 }}>A chapter or a section works best — up to 40 verses.</div>}
        </div>

        {/* Role selector */}
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: SLATE, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 12 }}>
            Select your role (up to 2)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {ROLES.map(r => {
              const active = roles.includes(r.id)
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRole(r.id)}
                  style={{
                    background:   active ? 'rgba(201,151,58,0.12)' : 'rgba(255,255,255,0.03)',
                    border:       `1px solid ${active ? 'rgba(201,151,58,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8,
                    padding:      '10px 12px',
                    textAlign:    'left' as const,
                    cursor:       'pointer',
                    fontFamily:   SANS,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? GOLD : PARCHMENT, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: SLATE }}>{r.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Example passages */}
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ fontSize: 11, color: SLATE, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 12 }}>
            Try an example
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => { setPassage(ex); setError('') }}
                style={{
                  background:   'rgba(255,255,255,0.04)',
                  border:       '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding:      '6px 14px',
                  fontSize:     13,
                  color:        SLATE,
                  cursor:       'pointer',
                  fontFamily:   SERIF,
                  fontStyle:    'italic' as const,
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing note */}
        <div style={{ marginTop: 48, display: 'flex', gap: 28, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: PARCHMENT }}>Free</div>
            <div style={{ fontSize: 12, color: SLATE }}>Overview tab</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>$2</div>
            <div style={{ fontSize: 12, color: SLATE }}>Practical Study</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#A78BFA' }}>$5</div>
            <div style={{ fontSize: 12, color: SLATE }}>Scholarly Depth</div>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 13, color: GOLD, textAlign: 'center' as const, fontFamily: SERIF, fontStyle: 'italic' as const }}>
          ✦ Your first study is free
        </div>

        <a
          href={`/study/${encodeURIComponent('Ephesians 1:15-23')}?roles=pastor&sample=1`}
          style={{ marginTop: 20, fontSize: 14, fontWeight: 600, color: PARCHMENT, textDecoration: 'none', border: `1px solid ${GOLD}`, borderRadius: 8, padding: '10px 20px' }}
        >
          See a complete sample study →
        </a>

      </div>

      {/* Footer */}
      <footer style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
        <div style={{ fontSize: 12, color: SLATE }}>© {new Date().getFullYear()} PassageLab</div>
        <div style={{ display: 'flex', gap: 18 }}>
          <a href="mailto:info@passagelab.app" style={{ fontSize: 12, color: SLATE, textDecoration: 'none' }}>Contact</a>
          <a href="/terms" style={{ fontSize: 12, color: SLATE, textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 12, color: SLATE, textDecoration: 'none' }}>Privacy</a>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
