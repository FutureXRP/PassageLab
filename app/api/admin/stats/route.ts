// PassageLab — app/api/admin/stats/route.ts
// Admin reporting. Service-role reads (bypass RLS), gated to ADMIN_EMAILS.
// Powers the /admin dashboard: revenue, study counts, recent charges,
// signups, render failures, and top passages.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    monthRowsRes,
    allTimeRowsRes,
    studiesCountRes,
    recentChargesRes,
    signupsRes,
    failuresRes,
    topPassagesRes,
    activeCouponsRes,
  ] = await Promise.all([
    // This month's unlock events (paid, free, or coupon)
    supabase.from('usage_events')
      .select('amount, study_type, promo, coupon_code, refunded')
      .gte('created_at', monthStart)
      .or('amount.gt.0,promo.is.true,coupon_code.not.is.null'),
    // All-time paid amounts (one lightweight column) for revenue + refunds
    supabase.from('usage_events')
      .select('amount, refunded')
      .gt('amount', 0),
    // All-time study count (paid + free + coupon)
    supabase.from('usage_events')
      .select('id', { count: 'exact', head: true })
      .or('amount.gt.0,promo.is.true,coupon_code.not.is.null'),
    // Recent charges with the buyer's email (for refunds)
    supabase.from('usage_events')
      .select('id, passage, study_type, amount, promo, coupon_code, discount_amount, refunded, created_at, stripe_payment_intent_id, profiles(email, full_name)')
      .or('amount.gt.0,promo.is.true,coupon_code.not.is.null')
      .order('created_at', { ascending: false })
      .limit(30),
    // Recent signups
    supabase.from('profiles')
      .select('email, full_name, card_last4, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
    // Unresolved render failures with the affected user's email
    supabase.from('render_failures')
      .select('id, passage, roles, tab_id, study_type, error, created_at, user_id, profiles(email)')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(40),
    // Most-studied passages (monitoring view)
    supabase.from('top_passages')
      .select('passage_norm, tab_count, total_hits')
      .order('total_hits', { ascending: false })
      .limit(10),
    supabase.from('coupons')
      .select('code', { count: 'exact', head: true })
      .eq('active', true),
  ])

  const monthRows = monthRowsRes.data || []
  const allTimeRows = allTimeRowsRes.data || []

  const monthRevenue = monthRows.reduce((s, r) => s + (r.refunded ? 0 : Number(r.amount)), 0)
  const monthQuick   = monthRows.filter(r => r.study_type === 'quick').length
  const monthDeep    = monthRows.filter(r => r.study_type === 'deep').length
  const monthFree    = monthRows.filter(r => r.promo).length
  const monthCoupon  = monthRows.filter(r => r.coupon_code && !r.promo).length

  const allTimeRevenue  = allTimeRows.reduce((s, r) => s + (r.refunded ? 0 : Number(r.amount)), 0)
  const refundedRows    = allTimeRows.filter(r => r.refunded)
  const refundedCount   = refundedRows.length
  const refundedTotal   = refundedRows.reduce((s, r) => s + Number(r.amount), 0)

  return NextResponse.json({
    month: {
      revenue: monthRevenue,
      quick:   monthQuick,
      deep:    monthDeep,
      free:    monthFree,
      coupon:  monthCoupon,
    },
    allTime: {
      revenue:       allTimeRevenue,
      studies:       studiesCountRes.count ?? 0,
      refundedCount,
      refundedTotal,
    },
    activeCoupons:  activeCouponsRes.count ?? 0,
    recentCharges:  recentChargesRes.data || [],
    recentSignups:  signupsRes.data || [],
    failures:       failuresRes.data || [],
    topPassages:    topPassagesRes.data || [],
  })
}
