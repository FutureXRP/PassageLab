// PassageLab — app/api/setup-intent/confirm/route.ts
// Saves verified Stripe payment method to user profile

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
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const { userId, email, paymentMethodId } = await req.json()

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ error: 'Missing userId or paymentMethodId' }, { status: 400 })
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
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Get card details for display
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const card = pm.card

    // Save to Supabase profile
    await supabase
      .from('profiles')
      .update({
        stripe_customer_id:       customerId,
        stripe_payment_method_id: paymentMethodId,
        card_last4:               card?.last4 || null,
        card_brand:               card?.brand || null,
        card_verified_at:         new Date().toISOString(),
      })
      .eq('id', userId)

    return NextResponse.json({
      success:   true,
      customerId,
      card_last4: card?.last4,
      card_brand: card?.brand,
    })

  } catch (err: any) {
    console.error('Confirm setup intent error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to save card' }, { status: 500 })
  }
}
