// PassageLab — app/api/checkout/route.ts
// Records a study unlock for the signed-in user and tracks the dollar
// amount for month-end billing. The user comes from the session cookie —
// never from the request body.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/auth'
import { getUnlockStatus, checkSpendingLimit, PRICES } from '@/lib/usage'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 503 })
    }

    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Please sign in first' },
        { status: 401 }
      )
    }

    const { tier, passage, roles } = await req.json()

    if (!tier || !passage || (tier !== 'quick' && tier !== 'deep')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const studyType = tier === 'deep' ? 'deep' : 'quick'

    // Check user has a verified payment method
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_payment_method_id, card_verified_at')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_payment_method_id || !profile?.card_verified_at) {
      return NextResponse.json(
        { error: 'no_payment_method', message: 'Please add a payment method first' },
        { status: 402 }
      )
    }

    // Idempotency + upgrade pricing:
    // - already unlocked at this tier (or deep covers quick) → no new charge
    // - quick → deep upgrade costs the $1 difference, not the full $2
    const unlocks = await getUnlockStatus(user.id, passage)
    if ((tier === 'quick' && unlocks.quick) || (tier === 'deep' && unlocks.deep)) {
      return NextResponse.json({ success: true, amount: 0, alreadyUnlocked: true })
    }

    const amount = tier === 'deep'
      ? (unlocks.quick ? PRICES.DEEP_DIVE - PRICES.QUICK_STUDY : PRICES.DEEP_DIVE)
      : PRICES.QUICK_STUDY

    // Enforce the user's monthly spending limit at unlock time
    const limitCheck = await checkSpendingLimit(user.id, amount)
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error:        'spending_limit_reached',
        message:      limitCheck.reason,
        currentSpend: limitCheck.currentSpend,
        limit:        limitCheck.limit,
      }, { status: 402 })
    }

    // Record the billable unlock event
    const { error: insertError } = await supabase.from('usage_events').insert({
      user_id:    user.id,
      passage,
      roles:      Array.isArray(roles) ? roles : typeof roles === 'string' ? roles.split(',') : [],
      tab_ids:    [tier],
      study_type: studyType,
      amount,
      cached:     false,
    })
    if (insertError) throw insertError

    // Update running monthly total on profile
    await supabase.rpc('increment_monthly_total', {
      p_user_id: user.id,
      p_amount:  amount,
    })

    return NextResponse.json({ success: true, amount })

  } catch (err: any) {
    console.error('Checkout error:', err?.message)
    return NextResponse.json(
      { error: 'checkout_failed', message: 'Could not record the unlock. Please try again.' },
      { status: 500 }
    )
  }
}
