// PassageLab — app/api/setup-intent/route.ts
// Creates a Stripe SetupIntent to save a card — $0 charge, just verification

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

export async function POST(req: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  try {
    const { userId, email } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create SetupIntent — saves card for future billing, $0 charge
    const setupIntent = await stripe.setupIntents.create({
      customer:              customerId,
      payment_method_types:  ['card'],
      usage:                 'off_session',   // allows future charges without user present
      metadata: {
        supabase_user_id: userId,
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })

  } catch (err: any) {
    console.error('SetupIntent error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to create setup intent' }, { status: 500 })
  }
}
