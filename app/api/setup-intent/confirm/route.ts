// PassageLab — app/api/setup-intent/confirm/route.ts
// Called after the client confirms the SetupIntent (including any 3DS/SCA
// challenge). Verifies the SetupIntent succeeded at Stripe, then saves the
// verified payment method to the user's profile.

import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(req: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Please sign in first' },
        { status: 401 }
      )
    }

    const { setupIntentId } = await req.json()
    if (!setupIntentId || typeof setupIntentId !== 'string') {
      return NextResponse.json({ error: 'Missing setupIntentId' }, { status: 400 })
    }

    // Verify with Stripe — the card is only saved if verification succeeded
    // and the SetupIntent belongs to this user
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

    if (setupIntent.metadata?.supabase_user_id !== user.id) {
      return NextResponse.json({ error: 'SetupIntent does not belong to this user' }, { status: 403 })
    }
    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'not_verified', message: `Card verification is ${setupIntent.status}. Please try again.` },
        { status: 400 }
      )
    }

    const customerId = typeof setupIntent.customer === 'string'
      ? setupIntent.customer
      : setupIntent.customer?.id
    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: 'SetupIntent missing customer or payment method' }, { status: 400 })
    }

    // Set as default payment method for off-session charges
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Get card details for display
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const card = pm.card

    // Save to Supabase profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id:       customerId,
        stripe_payment_method_id: paymentMethodId,
        card_last4:               card?.last4 || null,
        card_brand:               card?.brand || null,
        card_verified_at:         new Date().toISOString(),
      })
      .eq('id', user.id)
    if (updateError) throw updateError

    return NextResponse.json({
      success:   true,
      customerId,
      card_last4: card?.last4,
      card_brand: card?.brand,
    })

  } catch (err: any) {
    console.error('Confirm setup intent error:', err?.message)
    return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
  }
}
