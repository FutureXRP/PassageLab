// PassageLab — app/api/admin/coupons/route.ts
// Admin coupon management. Service-role, gated to ADMIN_EMAILS.
//   GET   — list all coupons
//   POST  — create/replace a coupon { code, description, type, value, max_redemptions?, expires_at? }
//   PATCH — enable/disable a coupon { code, active }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupons: data || [] })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const code = String(body.code || '').trim().toUpperCase()
  const type = body.type === 'fixed' ? 'fixed' : body.type === 'percent' ? 'percent' : null
  const value = Number(body.value)

  if (!code || !/^[A-Z0-9_-]{3,40}$/.test(code)) {
    return NextResponse.json({ error: 'Code must be 3-40 chars (A-Z, 0-9, - or _).' }, { status: 400 })
  }
  if (!type) {
    return NextResponse.json({ error: "Type must be 'percent' or 'fixed'." }, { status: 400 })
  }
  if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) {
    return NextResponse.json({ error: 'Enter a valid value (percent 1-100, or a positive dollar amount).' }, { status: 400 })
  }

  const maxRedemptions = body.max_redemptions == null || body.max_redemptions === ''
    ? null
    : Math.max(1, Math.floor(Number(body.max_redemptions)))
  const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null

  // Upsert by code — re-creating an existing code updates its terms and
  // resets it active. Redemption count is preserved (not in the payload).
  const { error } = await supabase.from('coupons').upsert({
    code,
    description: body.description ? String(body.description).slice(0, 200) : null,
    type,
    value,
    active: true,
    max_redemptions: maxRedemptions,
    expires_at: expiresAt,
  }, { onConflict: 'code' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, code })
}

export async function PATCH(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const code = String(body.code || '').trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { error } = await supabase
    .from('coupons')
    .update({ active: !!body.active })
    .eq('code', code)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, code, active: !!body.active })
}
