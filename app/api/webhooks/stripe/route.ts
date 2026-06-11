// PassageLab — app/api/webhooks/stripe/route.ts
// Stripe webhook handler. Configure in Stripe Dashboard → Developers →
// Webhooks, pointing at https://<domain>/api/webhooks/stripe with events:
//   payment_intent.succeeded, payment_intent.payment_failed,
//   charge.dispute.created
// Set the signing secret as STRIPE_WEBHOOK_SECRET.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !supabase || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  // Signature verification requires the raw request body
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await req.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        await supabase
          .from('billing_records')
          .update({ status: 'paid', charged_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', pi.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.error(
          `Payment failed for user ${pi.metadata?.user_id || 'unknown'}: ` +
          (pi.last_payment_error?.message || 'unknown error')
        )
        await supabase
          .from('billing_records')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id)
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        // Surface in logs — disputes need human attention
        console.error(`Stripe dispute created: ${dispute.id} for charge ${dispute.charge}, amount ${dispute.amount}`)
        break
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err?.message)
    // 500 makes Stripe retry — desired for transient database failures
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
