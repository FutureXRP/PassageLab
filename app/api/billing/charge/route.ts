// PassageLab — app/api/billing/charge/route.ts
// Monthly billing job — sums unbilled usage per user and charges their saved card
// Called by a cron job on the 1st of each month (set up in Vercel Cron)

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

const CRON_SECRET = process.env.CRON_SECRET

// Users are charged in parallel batches to stay within the function budget
const BATCH_SIZE = 10

export const maxDuration = 60

// Vercel Cron invokes endpoints with GET — delegate to the same handler
export async function GET(req: NextRequest) {
  return POST(req)
}

type ChargeResult =
  | { userId: string; status: 'charged'; amount: number; paymentIntentId: string }
  | { userId: string; status: 'skipped'; reason: string }
  | { userId: string; status: 'failed'; error?: string }

async function chargeUser(
  db: SupabaseClient,
  stripeClient: Stripe,
  userId: string,
  totalAmount: number,
  billingPeriod: string
): Promise<ChargeResult> {
  try {
    // Get user's saved payment method
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id, stripe_payment_method_id, email, card_last4')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
      return { userId, status: 'skipped', reason: 'No payment method' }
    }

    // Get study breakdown for the invoice description (unlock events only)
    const { data: events } = await db
      .from('usage_events')
      .select('study_type')
      .eq('user_id', userId)
      .eq('billed', false)
      .gt('amount', 0)

    const quickCount = events?.filter(e => e.study_type === 'quick').length || 0
    const deepCount  = events?.filter(e => e.study_type === 'deep').length || 0

    // Charge the saved card
    const amountCents = Math.round(totalAmount * 100)
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount:              amountCents,
      currency:            'usd',
      customer:            profile.stripe_customer_id,
      payment_method:      profile.stripe_payment_method_id,
      off_session:         true,
      confirm:             true,
      description:         `PassageLab ${billingPeriod} — ${quickCount} Quick Studies + ${deepCount} Scholarly Depths`,
      metadata: {
        user_id:        userId,
        billing_period: billingPeriod,
        quick_count:    String(quickCount),
        deep_count:     String(deepCount),
      },
    })

    // Record the billing
    await db.from('billing_records').upsert({
      user_id:                   userId,
      billing_period:            billingPeriod,
      quick_study_count:         quickCount,
      deep_study_count:          deepCount,
      total_amount:              totalAmount,
      stripe_payment_intent_id:  paymentIntent.id,
      status:                    paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      charged_at:                new Date().toISOString(),
    }, { onConflict: 'user_id,billing_period' })

    // Mark usage events as billed (including amount-0 analytics events)
    await db
      .from('usage_events')
      .update({ billed: true, billed_at: new Date().toISOString(), billing_period: billingPeriod })
      .eq('user_id', userId)
      .eq('billed', false)

    // Update profile
    await db
      .from('profiles')
      .update({
        last_billed_at:      new Date().toISOString(),
        last_bill_amount:    totalAmount,
        current_month_total: 0,
      })
      .eq('id', userId)

    return { userId, status: 'charged', amount: totalAmount, paymentIntentId: paymentIntent.id }

  } catch (err: any) {
    console.error(`Billing failed for user ${userId}:`, err?.message)

    // Record failed billing — the webhook and next month's run pick it up
    await db.from('billing_records').upsert({
      user_id:        userId,
      billing_period: billingPeriod,
      total_amount:   totalAmount,
      status:         'failed',
    }, { onConflict: 'user_id,billing_period' })

    return { userId, status: 'failed', error: err?.message }
  }
}

export async function POST(req: NextRequest) {
  // Fail closed — the billing endpoint must never run unauthenticated
  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not set — refusing to run billing')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const now = new Date()
  const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Get all users with unbilled, billable usage
  const { data: unbilledUsers, error } = await supabase
    .from('usage_events')
    .select('user_id, amount')
    .eq('billed', false)
    .gt('amount', 0)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by user
  const userTotals: Record<string, number> = {}
  for (const row of unbilledUsers || []) {
    if (!row.user_id) continue
    userTotals[row.user_id] = (userTotals[row.user_id] || 0) + Number(row.amount)
  }

  // Skip tiny amounts — not worth the Stripe fee; they roll into next month
  const billable = Object.entries(userTotals).filter(([, total]) => total >= 0.50)

  const results: ChargeResult[] = []
  for (let i = 0; i < billable.length; i += BATCH_SIZE) {
    const batch = billable.slice(i, i + BATCH_SIZE)
    const settled = await Promise.allSettled(
      batch.map(([userId, total]) => chargeUser(supabase, stripe, userId, total, billingPeriod))
    )
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value)
      else results.push({ userId: 'unknown', status: 'failed', error: String(s.reason) })
    }
  }

  return NextResponse.json({
    billingPeriod,
    processed: results.length,
    results,
  })
}
