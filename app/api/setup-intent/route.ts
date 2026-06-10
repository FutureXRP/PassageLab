// PassageLab — app/api/setup-intent/route.ts
// Creates a Stripe SetupIntent to save a card — $0 charge, just verification.
// The client confirms it with stripe.confirmCardSetup(), which handles
// 3D Secure / SCA challenges, then calls /api/setup-intent/confirm.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/auth'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

export async function POST() {
  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Please sign in first' },
        { status: 401 }
      )
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create SetupIntent — saves card for future billing, $0 charge
    const setupIntent = await stripe.setupIntents.create({
      customer:              customerId,
      payment_method_types:  ['card'],
      usage:                 'off_session',   // allows future charges without user present
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })

  } catch (err: any) {
    console.error('SetupIntent error:', err?.message)
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 })
  }
}
