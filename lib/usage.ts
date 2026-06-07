// PassageLab — usage.ts
// Usage tracking, spending limits, Stripe metered billing

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' as any })
  : null

// ─── Pricing ───────────────────────────────────────────────────────────────

export const PRICES = {
  QUICK_STUDY: 1.00,
  DEEP_DIVE:   2.00,
} as const

// Stripe metered price IDs — create these in your Stripe dashboard
// Products → Add product → Recurring → Usage-based → Per unit
export const STRIPE_PRICE_IDS = {
  QUICK_STUDY: process.env.STRIPE_QUICK_STUDY_PRICE_ID!,
  DEEP_DIVE:   process.env.STRIPE_DEEP_DIVE_PRICE_ID!,
}

// ─── Spending limit check ──────────────────────────────────────────────────

export async function checkSpendingLimit(
  userId: string,
  studyPrice: number
): Promise<{ allowed: boolean; reason?: string; currentSpend: number; limit: number }> {
  if (!supabase) return { allowed: true, currentSpend: 0, limit: 0 }
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('monthly_spending_limit, stripe_subscription_id')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { allowed: false, reason: 'Profile not found', currentSpend: 0, limit: 0 }
    }

    // No limit set — allow
    if (!profile.monthly_spending_limit) {
      return { allowed: true, currentSpend: 0, limit: 0 }
    }

    // Get current month spend
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: usage } = await supabase
      .from('usage_events')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', monthStart)

    const currentSpend = (usage || []).reduce((sum, u) => sum + u.amount, 0)
    const limit = profile.monthly_spending_limit

    if (currentSpend + studyPrice > limit) {
      return {
        allowed: false,
        reason: `Monthly spending limit of $${limit.toFixed(2)} would be exceeded. Current spend: $${currentSpend.toFixed(2)}.`,
        currentSpend,
        limit,
      }
    }

    return { allowed: true, currentSpend, limit }
  } catch (err) {
    console.error('Spending limit check failed:', err)
    // Fail open — allow the study but log the error
    return { allowed: true, currentSpend: 0, limit: 0 }
  }
}

// ─── Record usage event ────────────────────────────────────────────────────

export async function recordUsageEvent(params: {
  userId: string
  passage: string
  roles: string[]
  tabIds: string[]
  studyType: 'quick' | 'deep'
  amount: number
  cached: boolean
  inputTokens: number
  outputTokens: number
  apiCostEstimate: number
}): Promise<void> {
  if (!supabase) return   // No Supabase — skip usage recording
  try {
    // 1. Write to usage_events table
    const { error } = await supabase
      .from('usage_events')
      .insert({
        user_id:            params.userId,
        passage:            params.passage,
        roles:              params.roles,
        tab_ids:            params.tabIds,
        study_type:         params.studyType,
        amount:             params.amount,
        cached:             params.cached,
        input_tokens:       params.inputTokens,
        output_tokens:      params.outputTokens,
        api_cost_estimate:  params.apiCostEstimate,
        created_at:         new Date().toISOString(),
      })

    if (error) throw error

    // 2. Report to Stripe metered billing (async, non-blocking)
    reportToStripe(params.userId, params.studyType).catch(err => {
      console.error('Stripe usage report failed:', err)
    })

  } catch (err) {
    console.error('Usage recording failed:', err)
  }
}

// ─── Stripe metered billing ────────────────────────────────────────────────
// Stripe v13+ uses billing meter events instead of usage records
// Set up meters in Stripe Dashboard → Billing → Meters
// Meter event names must match what you create in the dashboard

const METER_EVENT_NAMES = {
  quick: 'passagelab_quick_study',
  deep:  'passagelab_deep_dive',
}

async function reportToStripe(
  userId: string,
  studyType: 'quick' | 'deep'
): Promise<void> {
  if (!stripe || !supabase) return
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) return

    // Stripe v13+ metered billing via meter events
    await (stripe.billing as any).meterEvents.create({
      event_name:     METER_EVENT_NAMES[studyType],
      payload: {
        stripe_customer_id: profile.stripe_customer_id,
        value:              '1',
      },
    })
  } catch (err) {
    // Non-fatal — log and continue
    console.error('Stripe meter event failed:', err)
  }
}

// ─── Get current month summary ─────────────────────────────────────────────

export async function getMonthSummary(userId: string): Promise<{
  totalSpend: number
  quickStudies: number
  deepDives: number
  studiesThisMonth: number
  spendingLimit: number | null
  remainingBudget: number | null
  topPassages: { passage: string; count: number }[]
}> {
  if (!supabase) return {
    totalSpend: 0, quickStudies: 0, deepDives: 0,
    studiesThisMonth: 0, spendingLimit: null,
    remainingBudget: null, topPassages: [],
  }
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [usageResult, profileResult] = await Promise.all([
    supabase
      .from('usage_events')
      .select('amount, study_type, passage, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart),
    supabase
      .from('profiles')
      .select('monthly_spending_limit')
      .eq('id', userId)
      .single(),
  ])

  const events = usageResult.data || []
  const limit = profileResult.data?.monthly_spending_limit || null

  const totalSpend = events.reduce((sum, e) => sum + e.amount, 0)
  const quickStudies = events.filter(e => e.study_type === 'quick').length
  const deepDives = events.filter(e => e.study_type === 'deep').length

  // Top passages this month
  const passageCounts: Record<string, number> = {}
  events.forEach(e => {
    passageCounts[e.passage] = (passageCounts[e.passage] || 0) + 1
  })
  const topPassages = Object.entries(passageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([passage, count]) => ({ passage, count }))

  return {
    totalSpend,
    quickStudies,
    deepDives,
    studiesThisMonth: events.length,
    spendingLimit: limit,
    remainingBudget: limit ? Math.max(0, limit - totalSpend) : null,
    topPassages,
  }
}