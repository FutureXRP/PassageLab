// PassageLab — app/api/billing/charge/route.ts
// Monthly billing job — sums unbilled usage per user and charges their saved card
// Called by a cron job on the 1st of each month (set up in Vercel Cron)

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-05-28.basil' as any })
  : null

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  // Protect endpoint — only callable by Vercel cron or admin
  const auth = req.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const now = new Date()
  const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Get all users with unbilled usage
  const { data: unbilledUsers, error } = await supabase
    .from('usage_events')
    .select('user_id, amount')
    .eq('billed', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by user
  const userTotals: Record<string, number> = {}
  for (const row of unbilledUsers || []) {
    if (!row.user_id) continue
    userTotals[row.user_id] = (userTotals[row.user_id] || 0) + Number(row.amount)
  }

  const results = []

  for (const [userId, totalAmount] of Object.entries(userTotals)) {
    if (totalAmount < 0.50) continue  // Skip tiny amounts — not worth the Stripe fee

    try {
      // Get user's saved payment method
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, stripe_payment_method_id, email, card_last4')
        .eq('id', userId)
        .single()

      if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
        results.push({ userId, status: 'skipped', reason: 'No payment method' })
        continue
      }

      // Get study breakdown for the invoice description
      const { data: events } = await supabase
        .from('usage_events')
        .select('study_type')
        .eq('user_id', userId)
        .eq('billed', false)

      const quickCount = events?.filter(e => e.study_type === 'quick').length || 0
      const deepCount  = events?.filter(e => e.study_type === 'deep').length || 0

      // Charge the saved card
      const amountCents = Math.round(totalAmount * 100)
      const paymentIntent = await stripe.paymentIntents.create({
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
      await supabase.from('billing_records').upsert({
        user_id:                   userId,
        billing_period:            billingPeriod,
        quick_study_count:         quickCount,
        deep_study_count:          deepCount,
        total_amount:              totalAmount,
        stripe_payment_intent_id:  paymentIntent.id,
        status:                    paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        charged_at:                new Date().toISOString(),
      }, { onConflict: 'user_id,billing_period' })

      // Mark usage events as billed
      await supabase
        .from('usage_events')
        .update({ billed: true, billed_at: new Date().toISOString(), billing_period: billingPeriod })
        .eq('user_id', userId)
        .eq('billed', false)

      // Update profile
      await supabase
        .from('profiles')
        .update({
          last_billed_at:      new Date().toISOString(),
          last_bill_amount:    totalAmount,
          current_month_total: 0,
        })
        .eq('id', userId)

      results.push({ userId, status: 'charged', amount: totalAmount, paymentIntentId: paymentIntent.id })

    } catch (err: any) {
      console.error(`Billing failed for user ${userId}:`, err?.message)

      // Record failed billing
      await supabase.from('billing_records').upsert({
        user_id:        userId,
        billing_period: billingPeriod,
        total_amount:   totalAmount,
        status:         'failed',
      }, { onConflict: 'user_id,billing_period' })

      results.push({ userId, status: 'failed', error: err?.message })
    }
  }

  return NextResponse.json({
    billingPeriod,
    processed: results.length,
    results,
  })
}
