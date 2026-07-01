// PassageLab — app/api/checkout/route.ts
// Unlocks a study for the signed-in user. Two paths:
//   1. Free first Deep Dive — one per account (promo), $0, no charge.
//   2. Paid unlock — the saved card is charged IMMEDIATELY (pay-at-unlock),
//      then recorded as a billed usage_event.
// The user comes from the session cookie — never from the request body.
// A verified card on file is required for both paths (we only let serious,
// card-on-file users claim the free study).

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/auth'
import {
  getUnlockStatus,
  hasClaimedFreeStudy,
  checkSpendingLimit,
  PRICES,
} from '@/lib/usage'
import { ACADEMIC_ENABLED } from '@/lib/flags'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null

// Best-effort, server-guarded redemption count (the SQL function won't exceed
// max_redemptions). Never throws into the request path.
async function redeemCoupon(code: string) {
  if (!supabase) return
  try {
    await supabase.rpc('redeem_coupon', { p_code: code })
  } catch { /* ignore */ }
}

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

    const { tier, passage, roles, couponCode } = await req.json()

    // 'academic' is only a valid tier while the feature flag is on — otherwise
    // it's rejected exactly as an unknown tier would be.
    const validTier =
      tier === 'quick' || tier === 'deep' || (tier === 'academic' && ACADEMIC_ENABLED)
    if (!validTier || !passage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const studyType: 'quick' | 'deep' | 'academic' =
      tier === 'academic' ? 'academic' : tier === 'deep' ? 'deep' : 'quick'
    const rolesArr = Array.isArray(roles)
      ? roles
      : typeof roles === 'string' ? roles.split(',') : []

    // A verified card on file is required — even to claim the free study
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_payment_method_id, card_verified_at')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_payment_method_id || !profile?.card_verified_at) {
      return NextResponse.json(
        { error: 'no_payment_method', message: 'Please add a payment method first' },
        { status: 402 }
      )
    }

    // Idempotency: already unlocked at this tier (or deep covers quick) → no-op.
    // Counts both paid charges and the free claim (see getUnlockStatus).
    const unlocks = await getUnlockStatus(user.id, passage)
    if (
      (tier === 'quick' && unlocks.quick) ||
      (tier === 'deep' && unlocks.deep) ||
      (tier === 'academic' && unlocks.academic)
    ) {
      return NextResponse.json({ success: true, amount: 0, alreadyUnlocked: true })
    }

    // ── Free first study — the Deep Dive ─────────────────────────────────────
    // One per account, Deep Dive tier ($10 value). Records a $0 promo unlock;
    // no Stripe charge. Recorded as study_type 'deep' so it unlocks the full
    // Deep Dive (and, being nested, the Quick tabs too). hasClaimedFreeStudy
    // fails closed, so an outage can't mint free studies.
    if (tier === 'deep' && !(await hasClaimedFreeStudy(user.id))) {
      const { error: freeError } = await supabase.from('usage_events').insert({
        user_id:    user.id,
        passage,
        roles:      rolesArr,
        tab_ids:    ['deep'],
        study_type: 'deep',
        amount:     0,
        promo:      true,
        cached:     false,
        billed:     true,
        billed_at:  new Date().toISOString(),
      })
      if (freeError) throw freeError
      return NextResponse.json({ success: true, amount: 0, free: true })
    }

    // ── Paid unlock ────────────────────────────────────────────────────────
    // Upgrade pricing: quick → deep costs the difference, not the full deep price.
    let baseAmount: number
    if (tier === 'academic') {
      // Upgrade pricing: pay only the difference from whatever is already unlocked
      baseAmount = unlocks.deep
        ? PRICES.ACADEMIC - PRICES.DEEP_DIVE
        : unlocks.quick
          ? PRICES.ACADEMIC - PRICES.QUICK_STUDY
          : PRICES.ACADEMIC
    } else if (tier === 'deep') {
      baseAmount = unlocks.quick ? PRICES.DEEP_DIVE - PRICES.QUICK_STUDY : PRICES.DEEP_DIVE
    } else {
      baseAmount = PRICES.QUICK_STUDY
    }

    // Apply a coupon if supplied — validates active / not expired / under cap.
    // An invalid code is rejected so the user can correct or remove it.
    let amount = baseAmount
    let discount = 0
    let appliedCoupon: string | null = null
    if (typeof couponCode === 'string' && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase()
      const { data: coupon } = await supabase
        .from('coupons').select('*').eq('code', code).maybeSingle()
      const valid = !!coupon
        && coupon.active === true
        && (coupon.expires_at == null || new Date(coupon.expires_at).getTime() > Date.now())
        && (coupon.max_redemptions == null || coupon.redemptions < coupon.max_redemptions)
      if (!valid) {
        return NextResponse.json(
          { error: 'invalid_coupon', message: "That coupon code isn't valid or has expired." },
          { status: 400 }
        )
      }
      discount = coupon!.type === 'percent'
        ? Math.round(baseAmount * Number(coupon!.value)) / 100
        : Number(coupon!.value)
      discount = Math.min(discount, baseAmount)
      amount = Math.max(0, Math.round((baseAmount - discount) * 100) / 100)
      appliedCoupon = code
    }

    // Enforce the user's own monthly spending limit on the amount actually
    // charged (self-imposed budget; the platform default is off — lib/usage.ts)
    const limitCheck = await checkSpendingLimit(user.id, amount)
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error:        'spending_limit_reached',
        message:      limitCheck.reason,
        currentSpend: limitCheck.currentSpend,
        limit:        limitCheck.limit,
      }, { status: 402 })
    }

    // A coupon that covers the full price → a real unlock with no charge.
    if (appliedCoupon && amount <= 0) {
      const { error: couponFreeErr } = await supabase.from('usage_events').insert({
        user_id: user.id, passage, roles: rolesArr, tab_ids: [tier],
        study_type: studyType, amount: 0, cached: false,
        coupon_code: appliedCoupon, discount_amount: discount,
        billed: true, billed_at: new Date().toISOString(),
      })
      if (couponFreeErr) throw couponFreeErr
      await redeemCoupon(appliedCoupon)
      return NextResponse.json({ success: true, amount: 0, coupon: appliedCoupon, discount })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'no_payment_method', message: 'Please add a payment method first' },
        { status: 402 }
      )
    }

    // Charge the saved card now. off_session mirrors the mandate established
    // when the card was verified via SetupIntent (usage: off_session) and the
    // month-end cron — the user is present, but a card just verified this way
    // charges cleanly without a fresh on-session 3DS dance. The rare card that
    // genuinely needs re-authentication surfaces as a clear, recoverable error.
    let paymentIntent: Stripe.PaymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount:         Math.round(amount * 100),
        currency:       'usd',
        customer:       profile.stripe_customer_id,
        payment_method: profile.stripe_payment_method_id,
        off_session:    true,
        confirm:        true,
        description:    `PassageLab ${studyType === 'academic' ? 'Academic Study' : studyType === 'deep' ? 'Deep Dive' : 'Quick Study'} — ${passage}`,
        metadata: {
          user_id:    user.id,
          passage,
          study_type: studyType,
        },
      })
    } catch (err: any) {
      // Card declined, expired, or needs re-authentication (authentication_required)
      console.error(`Immediate charge failed for user ${user.id}:`, err?.code, err?.message)
      const message = err?.code === 'authentication_required'
        ? 'Your card needs re-verification. Please re-add your card and try again.'
        : (err?.message || 'Your card was declined. Please try another card.')
      return NextResponse.json({ error: 'charge_failed', message }, { status: 402 })
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({
        error:   'charge_incomplete',
        message: 'Payment could not be completed. Please try another card.',
      }, { status: 402 })
    }

    // Record the billable unlock — already billed (charged at this moment), so
    // the month-end cron never re-charges it.
    const { error: insertError } = await supabase.from('usage_events').insert({
      user_id:    user.id,
      passage,
      roles:      rolesArr,
      tab_ids:    [tier],
      study_type: studyType,
      amount,
      cached:     false,
      coupon_code: appliedCoupon,
      discount_amount: discount,
      billed:     true,
      billed_at:  new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
    })
    if (insertError) {
      // The charge succeeded but we couldn't record entitlement. Log loudly —
      // the PaymentIntent id is the recovery key — and still grant this unlock.
      console.error(
        `CHARGED BUT NOT RECORDED — user ${user.id}, passage "${passage}", ` +
        `payment_intent ${paymentIntent.id}:`, insertError
      )
    }

    // Count the coupon redemption now that the charge succeeded
    if (appliedCoupon) await redeemCoupon(appliedCoupon)

    // Keep the profile's running monthly total in sync (display only — never
    // fail the unlock over it; the charge has already succeeded)
    try {
      await supabase.rpc('increment_monthly_total', { p_user_id: user.id, p_amount: amount })
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, amount, coupon: appliedCoupon, discount })

  } catch (err: any) {
    console.error('Checkout error:', err?.message)
    return NextResponse.json(
      { error: 'checkout_failed', message: 'Could not complete the unlock. Please try again.' },
      { status: 500 }
    )
  }
}
