'use client'

// PassageLab — app/admin/page.tsx
// Admin dashboard: reporting, render failures (+ refunds), recent charges
// (+ refunds), and coupon management. Authorization is enforced server-side in
// /api/admin/* (ADMIN_EMAILS allowlist) — this page just reflects it: a 403
// shows "not authorized", a 200 renders the data.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'

const SERIF     = "'Playfair Display', Georgia, serif"
const SANS      = "'DM Sans', system-ui, sans-serif"
const GOLD      = '#C9973A'
const PARCHMENT = '#F5F0E8'
const SLATE     = '#8892A4'
const INK       = '#0D1117'
const PURPLE    = '#A78BFA'
const GREEN     = '#34D399'
const RED       = '#F87171'

const supabase = typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createBrowserSupabase()
    : null

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '20px 22px', marginBottom: 16,
}
const secTitle: React.CSSProperties = {
  fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.2px',
  fontWeight: 600, marginBottom: 12, fontFamily: SANS,
}
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '10px 12px', fontSize: 14, color: PARCHMENT,
  fontFamily: SANS, outline: 'none', boxSizing: 'border-box',
}
const btn: React.CSSProperties = {
  background: GOLD, color: INK, border: 'none', borderRadius: 8,
  padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
}
const btnGhost: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: SLATE,
  borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: SANS,
}
const row: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
}

// PostgREST embeds a to-one relation as an object (sometimes typed as array)
function emailOf(r: any): string {
  const p = r?.profiles
  const e = Array.isArray(p) ? p[0]?.email : p?.email
  return e || '—'
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: color || PARCHMENT }}>{value}</div>
      <div style={{ fontSize: 12, color: SLATE }}>{label}</div>
    </div>
  )
}

export default function AdminPage() {
  const [loading, setLoading]   = useState(true)
  const [authed, setAuthed]     = useState(false)
  const [notAdmin, setNotAdmin] = useState(false)
  const [stats, setStats]       = useState<any>(null)
  const [coupons, setCoupons]   = useState<any[]>([])
  const [busy, setBusy]         = useState<string | null>(null)
  const [msg, setMsg]           = useState('')

  // sign-in form
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [authErr, setAuthErr]   = useState('')

  // coupon form
  const [cCode, setCCode]   = useState('')
  const [cType, setCType]   = useState<'percent' | 'fixed'>('percent')
  const [cValue, setCValue] = useState('')
  const [cMax, setCMax]     = useState('')
  const [cExp, setCExp]     = useState('')
  const [cDesc, setCDesc]   = useState('')

  const loadAll = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.status === 403 || res.status === 401) { setNotAdmin(true); return }
    if (res.ok) {
      setStats(await res.json())
      const cRes = await fetch('/api/admin/coupons')
      if (cRes.ok) setCoupons((await cRes.json()).coupons || [])
    }
  }, [])

  useEffect(() => {
    async function init() {
      if (!supabase) { setLoading(false); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) { setAuthed(true); await loadAll() }
      setLoading(false)
    }
    init()
  }, [loadAll])

  async function signIn() {
    if (!supabase) return
    setAuthErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setAuthErr(error.message); return }
    setAuthed(true)
    setLoading(true)
    await loadAll()
    setLoading(false)
  }

  async function act(key: string, url: string, body: any, ok: string) {
    setBusy(key); setMsg('')
    try {
      const res = await fetch(url, {
        method: body._method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg(json.error || 'Action failed'); return }
      setMsg(ok)
      await loadAll()
    } finally {
      setBusy(null)
    }
  }

  const refundCharge = (id: string) =>
    act(`refund:${id}`, '/api/admin/refund', { usageEventId: id }, 'Refunded ✓')
  const refundFailure = (userId: string, passage: string, fid: string) =>
    act(`rf:${fid}`, '/api/admin/refund', { userId, passage }, 'Refunded ✓')
  const resolveFailure = (fid: string) =>
    act(`res:${fid}`, '/api/admin/refund', { failureId: fid, action: 'resolve' }, 'Marked resolved ✓')
  const toggleCoupon = (code: string, active: boolean) =>
    act(`c:${code}`, '/api/admin/coupons', { _method: 'PATCH', code, active }, 'Updated ✓')

  async function createCoupon() {
    await act('newcoupon', '/api/admin/coupons', {
      code: cCode, type: cType, value: Number(cValue),
      max_redemptions: cMax || null, expires_at: cExp || null, description: cDesc || null,
    }, 'Coupon saved ✓')
    setCCode(''); setCValue(''); setCMax(''); setCExp(''); setCDesc('')
  }

  const money = (n: any) => `$${Number(n || 0).toFixed(2)}`

  return (
    <div style={{ background: INK, minHeight: '100vh', color: PARCHMENT, fontFamily: SANS }}>
      <nav style={{ padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: PARCHMENT, textDecoration: 'none' }}>
          Passage<span style={{ color: GOLD }}>Lab</span> <span style={{ fontSize: 12, color: SLATE }}>· Admin</span>
        </Link>
        <Link href="/account" style={{ fontSize: 12, color: SLATE, textDecoration: 'none' }}>Account →</Link>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 24px 80px' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Admin</h1>

        {loading && <div style={{ color: SLATE }}>Loading…</div>}

        {!loading && notAdmin && (
          <div style={{ ...card, maxWidth: 460 }}>
            <div style={{ fontSize: 14, color: PARCHMENT, marginBottom: 8 }}>Not authorized</div>
            <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.6 }}>
              This account isn&apos;t an admin. Add its email to the <code style={{ color: GOLD }}>ADMIN_EMAILS</code> environment variable, then reload.
            </div>
          </div>
        )}

        {!loading && !authed && !notAdmin && (
          <div style={{ ...card, maxWidth: 380 }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Admin sign in</div>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 10 }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && signIn()} style={{ ...inputStyle, width: '100%', marginBottom: 14 }} />
            {authErr && <div style={{ fontSize: 13, color: RED, marginBottom: 10 }}>{authErr}</div>}
            <button onClick={signIn} style={{ ...btn, width: '100%' }}>Sign In</button>
          </div>
        )}

        {!loading && authed && stats && (
          <>
            {msg && <div style={{ fontSize: 13, color: GREEN, marginBottom: 14 }}>{msg}</div>}

            {/* Headline reporting */}
            <div style={card}>
              <div style={secTitle}>This Month</div>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <Stat label="revenue" value={money(stats.month.revenue)} color={GOLD} />
                <Stat label="quick studies" value={String(stats.month.quick)} />
                <Stat label="deep dives" value={String(stats.month.deep)} />
                <Stat label="free studies" value={String(stats.month.free)} color={GREEN} />
                <Stat label="coupon unlocks" value={String(stats.month.coupon)} color={PURPLE} />
              </div>
            </div>
            <div style={card}>
              <div style={secTitle}>All Time</div>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <Stat label="net revenue" value={money(stats.allTime.revenue)} color={GOLD} />
                <Stat label="studies" value={String(stats.allTime.studies)} />
                <Stat label="refunds" value={String(stats.allTime.refundedCount)} color={RED} />
                <Stat label="refunded $" value={money(stats.allTime.refundedTotal)} color={RED} />
                <Stat label="active coupons" value={String(stats.activeCoupons)} color={PURPLE} />
              </div>
            </div>

            {/* Render failures */}
            <div style={card}>
              <div style={secTitle}>Render Failures — needs attention</div>
              {stats.failures.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>No unresolved failures. 🎉</div>}
              {stats.failures.map((f: any) => (
                <div key={f.id} style={row}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      <span style={{ fontFamily: SERIF, fontStyle: 'italic' }}>{f.passage}</span>
                      <span style={{ color: SLATE, fontWeight: 400 }}> · {f.tab_id} ({f.study_type})</span>
                    </div>
                    <div style={{ fontSize: 12, color: SLATE }}>{emailOf(f)} · {new Date(f.created_at).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: RED, marginTop: 2 }}>{f.error}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button disabled={!!busy} onClick={() => refundFailure(f.user_id, f.passage, f.id)} style={{ ...btn, background: RED, color: '#1a0e0e' }}>Refund</button>
                    <button disabled={!!busy} onClick={() => resolveFailure(f.id)} style={btnGhost}>Resolve</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupons */}
            <div style={card}>
              <div style={secTitle}>Coupons</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <input placeholder="CODE" value={cCode} onChange={e => setCCode(e.target.value.toUpperCase())} style={{ ...inputStyle, width: 120 }} />
                <select value={cType} onChange={e => setCType(e.target.value as any)} style={{ ...inputStyle, width: 110 }}>
                  <option value="percent">% off</option>
                  <option value="fixed">$ off</option>
                </select>
                <input placeholder={cType === 'percent' ? '20' : '1.00'} value={cValue} onChange={e => setCValue(e.target.value)} style={{ ...inputStyle, width: 80 }} />
                <input placeholder="max uses" value={cMax} onChange={e => setCMax(e.target.value)} style={{ ...inputStyle, width: 90 }} />
                <input type="date" value={cExp} onChange={e => setCExp(e.target.value)} style={{ ...inputStyle, width: 150 }} title="Expiry (optional)" />
                <button disabled={!!busy} onClick={createCoupon} style={btn}>Add</button>
              </div>
              {coupons.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>No coupons yet.</div>}
              {coupons.map((c: any) => (
                <div key={c.code} style={row}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.active ? GOLD : SLATE }}>
                      {c.code} <span style={{ fontWeight: 400, color: SLATE }}>· {c.type === 'percent' ? `${c.value}% off` : `${money(c.value)} off`}</span>
                    </div>
                    <div style={{ fontSize: 12, color: SLATE }}>
                      {c.redemptions} used{c.max_redemptions ? ` / ${c.max_redemptions}` : ''}
                      {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                      {c.active ? '' : ' · disabled'}
                    </div>
                  </div>
                  <button disabled={!!busy} onClick={() => toggleCoupon(c.code, !c.active)} style={btnGhost}>
                    {c.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>

            {/* Recent charges */}
            <div style={card}>
              <div style={secTitle}>Recent Charges</div>
              {stats.recentCharges.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>No charges yet.</div>}
              {stats.recentCharges.map((c: any) => {
                const free = c.promo || (c.coupon_code && Number(c.amount) === 0)
                return (
                  <div key={c.id} style={row}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        <span style={{ fontFamily: SERIF, fontStyle: 'italic' }}>{c.passage}</span>
                        <span style={{ color: SLATE, fontWeight: 400 }}> · {c.study_type === 'deep' ? 'Deep' : 'Quick'}</span>
                        {c.coupon_code && <span style={{ color: PURPLE, fontWeight: 400 }}> · {c.coupon_code}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: SLATE }}>{emailOf(c)} · {new Date(c.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: c.refunded ? SLATE : free ? GREEN : GOLD, textDecoration: c.refunded ? 'line-through' : 'none' }}>
                        {free ? 'Free' : money(c.amount)}
                      </span>
                      {c.refunded
                        ? <span style={{ fontSize: 11, color: RED }}>refunded</span>
                        : (!free && c.stripe_payment_intent_id) &&
                            <button disabled={!!busy} onClick={() => refundCharge(c.id)} style={btnGhost}>Refund</button>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top passages + signups */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ ...card, flex: 1, minWidth: 280 }}>
                <div style={secTitle}>Top Passages</div>
                {stats.topPassages.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>No data yet.</div>}
                {stats.topPassages.map((p: any, i: number) => (
                  <div key={i} style={{ ...row, padding: '8px 0' }}>
                    <span style={{ fontSize: 13, fontFamily: SERIF, fontStyle: 'italic' }}>{p.passage_norm}</span>
                    <span style={{ fontSize: 12, color: SLATE }}>{p.total_hits} hits</span>
                  </div>
                ))}
              </div>
              <div style={{ ...card, flex: 1, minWidth: 280 }}>
                <div style={secTitle}>Recent Signups</div>
                {stats.recentSignups.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>No signups yet.</div>}
                {stats.recentSignups.map((s: any, i: number) => (
                  <div key={i} style={{ ...row, padding: '8px 0' }}>
                    <span style={{ fontSize: 13 }}>{s.email || '—'}</span>
                    <span style={{ fontSize: 12, color: s.card_last4 ? GREEN : SLATE }}>{s.card_last4 ? `card ••${s.card_last4}` : 'no card'}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
