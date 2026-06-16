// PassageLab — usage.ts
// Usage tracking, spending limits, unlock entitlements
//
// Billing model: each study unlock ($1 quick / $2 deep) is recorded by
// /api/checkout as a usage_event with a dollar amount. Per-tab generation
// events carry amount 0 (analytics only). The monthly cron in
// /api/billing/charge sums unbilled amounts and charges the saved card.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Pricing ───────────────────────────────────────────────────────────────

export const PRICES = {
  QUICK_STUDY: 1.00,
  DEEP_DIVE:   2.00,
} as const

// Default monthly cap (USD) applied to any user who hasn't set their own limit.
// Bounds API-cost exposure per account so one user can't run up an unbounded
// bill before month-end collection. Users can raise/lower it on the account
// page; set DEFAULT_MONTHLY_CAP=0 in the env to disable the default entirely.
const DEFAULT_MONTHLY_CAP = Number(process.env.DEFAULT_MONTHLY_CAP) || 50

// ─── Unlock entitlements ───────────────────────────────────────────────────
// An unlock is a usage_event with a positive amount, written by /api/checkout.
// 'deep' covers everything; 'quick' covers only quick (Haiku) tabs.

export interface UnlockStatus {
  quick: boolean
  deep: boolean
}

export async function getUnlockStatus(
  userId: string,
  passage: string
): Promise<UnlockStatus> {
  if (!supabase) return { quick: false, deep: false }
  try {
    // The client sends the identical passage string to /api/checkout and
    // /api/tab, so an exact match is sufficient here
    const { data } = await supabase
      .from('usage_events')
      .select('study_type')
      .eq('user_id', userId)
      .eq('passage', passage)
      .gt('amount', 0)

    const types = new Set((data || []).map(e => e.study_type))
    return {
      deep:  types.has('deep'),
      quick: types.has('quick') || types.has('deep'),
    }
  } catch {
    return { quick: false, deep: false }
  }
}

// ─── Spending limit check ──────────────────────────────────────────────────

export async function checkSpendingLimit(
  userId: string,
  studyPrice: number
): Promise<{ allowed: boolean; reason?: string; currentSpend: number; limit: number }> {
  if (!supabase) return { allowed: true, currentSpend: 0, limit: 0 }
  try {
    // select('*') instead of naming columns: on a database that predates a
    // column, a named select 400s and would block paying customers
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Infrastructure/schema problem — fail open rather than block checkout
      console.error('Spending limit check could not load profile:', error?.message)
      return { allowed: true, currentSpend: 0, limit: 0 }
    }

    // Effective monthly cap: the user's own limit if they've set a positive
    // one, otherwise the platform default. Bounds exposure for accounts that
    // never touch the setting; users can raise it on the account page.
    const userLimit = Number(profile.monthly_spending_limit)
    const hasOwnLimit = Number.isFinite(userLimit) && userLimit > 0
    const limit = hasOwnLimit ? userLimit : DEFAULT_MONTHLY_CAP

    // No effective cap (default disabled via env AND no personal limit) — allow
    if (!limit || limit <= 0) {
      return { allowed: true, currentSpend: 0, limit: 0 }
    }

    // Get this month's billable spend
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: usage } = await supabase
      .from('usage_events')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', monthStart)
      .gt('amount', 0)

    const currentSpend = (usage || []).reduce((sum, u) => sum + Number(u.amount), 0)

    if (currentSpend + studyPrice > limit) {
      return {
        allowed: false,
        reason: hasOwnLimit
          ? `Your monthly limit of $${limit.toFixed(2)} would be exceeded (this month: $${currentSpend.toFixed(2)}). Raise it on your account page.`
          : `You've reached this month's $${limit.toFixed(2)} study limit. It resets on the 1st — you can raise it anytime on your account page.`,
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
  } catch (err) {
    console.error('Usage recording failed:', err)
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
      .gte('created_at', monthStart)
      .gt('amount', 0),
    supabase
      .from('profiles')
      .select('monthly_spending_limit')
      .eq('id', userId)
      .single(),
  ])

  const events = usageResult.data || []
  const limit = profileResult.data?.monthly_spending_limit || null

  const totalSpend = events.reduce((sum, e) => sum + Number(e.amount), 0)
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
