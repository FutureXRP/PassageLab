// PassageLab — app/api/checkout/route.ts
// After card is verified, records the study unlock and tracks usage for month-end billing

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

export async function POST(req: NextRequest) {
  try {
    const { userId, tier, passage, roles } = await req.json()

    if (!userId || !tier || !passage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount     = tier === 'deep' ? 2.00 : 1.00
    const studyType  = tier === 'deep' ? 'deep' : 'quick'

    // Check user has a verified payment method
    if (supabase) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_payment_method_id, card_verified_at')
        .eq('id', userId)
        .single()

      if (!profile?.stripe_payment_method_id || !profile?.card_verified_at) {
        return NextResponse.json(
          { error: 'no_payment_method', message: 'Please add a payment method first' },
          { status: 402 }
        )
      }

      // Record usage event for month-end billing
      await supabase.from('usage_events').insert({
        user_id:    userId,
        passage,
        roles:      Array.isArray(roles) ? roles : roles.split(','),
        tab_ids:    [tier],
        study_type: studyType,
        amount,
        cached:     false,
      })

      // Update running monthly total on profile
      await supabase.rpc('increment_monthly_total', {
        p_user_id: userId,
        p_amount:  amount,
      })
    }

    return NextResponse.json({ success: true, amount })

  } catch (err: any) {
    console.error('Checkout error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
