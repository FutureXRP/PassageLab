'use client'

// PassageLab — app/account/page.tsx
// Account dashboard: month summary, spending limit, card on file, billing history

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'

const SERIF     = "'Playfair Display', Georgia, serif"
const SANS      = "'DM Sans', system-ui, sans-serif"
const GOLD      = '#C9973A'
const PARCHMENT = '#F5F0E8'
const SLATE     = '#8892A4'
const INK       = '#0D1117'

const supabase = typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createBrowserSupabase()
    : null

interface ProfileRow {
  email: string | null
  full_name: string | null
  card_last4: string | null
  card_brand: string | null
  monthly_spending_limit: number | null
}

interface BillingRow {
  billing_period: string
  quick_study_count: number
  deep_study_count: number
  total_amount: number
  status: string
}

interface SavedStudyRow {
  id: string
  passage: string
  roles: string[]
  updated_at: string
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '20px 22px',
  marginBottom: 16,
}

const secTitle: React.CSSProperties = {
  fontSize: 10, color: GOLD, textTransform: 'uppercase',
  letterSpacing: '1.2px', fontWeight: 600, marginBottom: 12, fontFamily: SANS,
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  padding: '12px 14px', fontSize: 14, color: PARCHMENT,
  fontFamily: SANS, outline: 'none', marginBottom: 12,
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  background: GOLD, color: INK, border: 'none', borderRadius: 8,
  padding: '12px 24px', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: SANS,
}

export default function AccountPage() {
  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)
  const [profile, setProfile]   = useState<ProfileRow | null>(null)
  const [billing, setBilling]   = useState<BillingRow[]>([])
  const [savedStudies, setSavedStudies] = useState<SavedStudyRow[]>([])
  const [monthSpend, setMonthSpend] = useState(0)
  const [quickCount, setQuickCount] = useState(0)
  const [deepCount, setDeepCount]   = useState(0)

  // Auth form
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError]       = useState('')

  // Spending limit form
  const [limitInput, setLimitInput] = useState('')
  const [limitSaved, setLimitSaved] = useState(false)

  async function loadAccount(uid: string) {
    if (!supabase) return
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [profileRes, usageRes, billingRes, studiesRes] = await Promise.all([
      supabase.from('profiles')
        .select('email, full_name, card_last4, card_brand, monthly_spending_limit')
        .eq('id', uid).single(),
      supabase.from('usage_events')
        .select('amount, study_type')
        .eq('user_id', uid)
        .gte('created_at', monthStart)
        .gt('amount', 0),
      supabase.from('billing_records')
        .select('billing_period, quick_study_count, deep_study_count, total_amount, status')
        .eq('user_id', uid)
        .order('billing_period', { ascending: false })
        .limit(12),
      supabase.from('saved_studies')
        .select('id, passage, roles, updated_at')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(100),
    ])

    if (profileRes.data) {
      setProfile(profileRes.data)
      setLimitInput(profileRes.data.monthly_spending_limit != null ? String(profileRes.data.monthly_spending_limit) : '')
    }
    const events = usageRes.data || []
    setMonthSpend(events.reduce((s, e) => s + Number(e.amount), 0))
    setQuickCount(events.filter(e => e.study_type === 'quick').length)
    setDeepCount(events.filter(e => e.study_type === 'deep').length)
    setBilling(billingRes.data || [])
    setSavedStudies(studiesRes.data || [])
  }

  async function deleteStudy(id: string) {
    if (!supabase) return
    await supabase.from('saved_studies').delete().eq('id', id)
    setSavedStudies(prev => prev.filter(s => s.id !== id))
  }

  useEffect(() => {
    async function init() {
      if (!supabase) { setLoading(false); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        await loadAccount(session.user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  async function handleAuth() {
    if (!supabase) { setError('Auth not configured'); return }
    setError('')
    try {
      if (authMode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } },
        })
        if (authError) throw authError
        if (data.user) { setUserId(data.user.id); await loadAccount(data.user.id) }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        if (data.user) { setUserId(data.user.id); await loadAccount(data.user.id) }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUserId(null)
    setProfile(null)
  }

  async function saveLimit() {
    if (!supabase || !userId) return
    setLimitSaved(false)
    setError('')
    const value = limitInput.trim() === '' ? null : Number(limitInput)
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setError('Enter a valid dollar amount, or leave blank for no limit')
      return
    }
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ monthly_spending_limit: value })
      .eq('id', userId)
    if (updateError) { setError(updateError.message); return }
    setLimitSaved(true)
  }

  return (
    <div style={{ background: INK, minHeight: '100vh', color: PARCHMENT, fontFamily: SANS }}>
      {/* Nav */}
      <nav style={{ padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: PARCHMENT, textDecoration: 'none' }}>
          Passage<span style={{ color: GOLD }}>Lab</span>
        </Link>
        {userId && (
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: SLATE, borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: SANS }}>
            Sign out
          </button>
        )}
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Account</h1>

        {loading && <div style={{ color: SLATE }}>Loading…</div>}

        {!loading && !userId && (
          <div style={{ ...card, maxWidth: 420 }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              {authMode === 'signup' ? 'Create your account' : 'Sign in'}
            </div>
            {authMode === 'signup' && (
              <input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
            )}
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} style={inputStyle} />
            {error && <div style={{ fontSize: 13, color: '#F87171', marginBottom: 12 }}>{error}</div>}
            <button onClick={handleAuth} style={{ ...btnPrimary, width: '100%', marginBottom: 12 }}>
              {authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 13, color: SLATE }}>
              {authMode === 'signup' ? 'Already have an account? ' : 'No account? '}
              <button onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setError('') }} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 13, fontFamily: SANS }}>
                {authMode === 'signup' ? 'Sign in' : 'Create one'}
              </button>
            </div>
          </div>
        )}

        {!loading && userId && (
          <>
            {/* This month */}
            <div style={card}>
              <div style={secTitle}>This Month</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: GOLD }}>${monthSpend.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: SLATE }}>spend so far</div>
                </div>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700 }}>{quickCount}</div>
                  <div style={{ fontSize: 12, color: SLATE }}>quick studies</div>
                </div>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700 }}>{deepCount}</div>
                  <div style={{ fontSize: 12, color: SLATE }}>deep dives</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: SLATE, marginTop: 14 }}>
                Billed once at month end{profile?.card_last4 ? ` to ${profile.card_brand || 'card'} •••• ${profile.card_last4}` : ' — no card on file yet'}.
              </div>
            </div>

            {/* Spending limit */}
            <div style={card}>
              <div style={secTitle}>Monthly Spending Limit</div>
              <div style={{ fontSize: 13, color: SLATE, marginBottom: 14, lineHeight: 1.6 }}>
                Studies that would push you past this amount are blocked until next month. Leave blank for no limit.
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 16, color: GOLD }}>$</span>
                <input
                  type="number" min="0" step="1" placeholder="No limit"
                  value={limitInput}
                  onChange={e => { setLimitInput(e.target.value); setLimitSaved(false) }}
                  style={{ ...inputStyle, marginBottom: 0, maxWidth: 140 }}
                />
                <button onClick={saveLimit} style={btnPrimary}>Save</button>
                {limitSaved && <span style={{ fontSize: 13, color: '#34D399' }}>Saved ✓</span>}
              </div>
              {error && <div style={{ fontSize: 13, color: '#F87171', marginTop: 10 }}>{error}</div>}
            </div>

            {/* Saved studies */}
            <div style={card}>
              <div style={secTitle}>Saved Studies</div>
              {savedStudies.length === 0 && (
                <div style={{ fontSize: 13, color: SLATE }}>
                  No saved studies yet — open a study and click &quot;Save Study&quot; to keep it on your account across devices.
                </div>
              )}
              {savedStudies.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/study/${encodeURIComponent(s.passage)}?roles=${s.roles.join(',')}`}
                      style={{ fontSize: 14, fontWeight: 600, color: GOLD, textDecoration: 'none', fontFamily: SERIF, fontStyle: 'italic' }}
                    >
                      {s.passage}
                    </Link>
                    <div style={{ fontSize: 12, color: SLATE }}>
                      {s.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(' + ')} · saved {new Date(s.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteStudy(s.id)}
                    title="Remove from saved studies"
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: SLATE, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: SANS, flexShrink: 0 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Billing history */}
            <div style={card}>
              <div style={secTitle}>Billing History</div>
              {billing.length === 0 && (
                <div style={{ fontSize: 13, color: SLATE }}>No bills yet — your first bill arrives at the start of next month.</div>
              )}
              {billing.map(b => (
                <div key={b.billing_period} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{b.billing_period}</div>
                    <div style={{ fontSize: 12, color: SLATE }}>{b.quick_study_count} quick · {b.deep_study_count} deep</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>${Number(b.total_amount).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: b.status === 'paid' ? '#34D399' : b.status === 'failed' ? '#F87171' : SLATE }}>{b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
