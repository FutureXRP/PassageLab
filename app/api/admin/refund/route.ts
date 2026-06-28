// PassageLab — app/api/admin/refund/route.ts
// Admin refunds + failure resolution. Service-role, gated to ADMIN_EMAILS.
//   POST { usageEventId }                 — refund that charge
//   POST { userId, passage }              — refund the user's latest paid charge for that passage
//   POST { failureId, action: 'resolve' } — mark a render failure resolved (no refund)
// A refund also marks any unresolved render failures for that user+passage resolved.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  // ── Mark a failure resolved without refunding ──────────────────────────────
  if (body.action === 'resolve' && body.failureId) {
    const { error } = await supabase
      .from('render_failures')
      .update({ resolved: true })
      .eq('id', body.failureId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, resolved: body.failureId })
  }

  // ── Resolve which charge to refund ─────────────────────────────────────────
  let event: any = null
  if (body.usageEventId) {
    const { data } = await supabase
      .from('usage_events')
      .select('id, user_id, passage, amount, refunded, stripe_payment_intent_id')
      .eq('id', body.usageEventId)
      .maybeSingle()
    event = data
  } else if (body.userId && body.passage) {
    const { data } = await supabase
      .from('usage_events')
      .select('id, user_id, passage, amount, refunded, stripe_payment_intent_id')
      .eq('user_id', body.userId)
      .eq('passage', body.passage)
      .gt('amount', 0)
      .eq('refunded', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    event = data
  } else {
    return NextResponse.json({ error: 'Provide usageEventId, or userId + passage.' }, { status: 400 })
  }

  if (!event) {
    return NextResponse.json({ error: 'No matching charge found.' }, { status: 404 })
  }
  if (event.refunded) {
    return NextResponse.json({ error: 'That charge is already refunded.' }, { status: 400 })
  }
  if (!event.stripe_payment_intent_id || Number(event.amount) <= 0) {
    return NextResponse.json(
      { error: 'Nothing to refund — that study was free (no charge).' },
      { status: 400 }
    )
  }
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  // ── Issue the Stripe refund ────────────────────────────────────────────────
  let refund: Stripe.Refund
  try {
    refund = await stripe.refunds.create({
      payment_intent: event.stripe_payment_intent_id,
    })
  } catch (err: any) {
    console.error('Refund failed:', err?.code, err?.message)
    return NextResponse.json(
      { error: err?.message || 'Stripe refund failed.' },
      { status: 502 }
    )
  }

  // ── Mark the charge refunded + resolve related failures ────────────────────
  await supabase
    .from('usage_events')
    .update({ refunded: true, refunded_at: new Date().toISOString(), stripe_refund_id: refund.id })
    .eq('id', event.id)

  if (event.user_id) {
    await supabase
      .from('render_failures')
      .update({ resolved: true })
      .eq('user_id', event.user_id)
      .eq('passage', event.passage)
      .eq('resolved', false)
  }

  return NextResponse.json({ success: true, amount: Number(event.amount), refundId: refund.id })
}
