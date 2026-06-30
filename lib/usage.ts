// PassageLab — usage.ts
// Usage tracking, spending limits, unlock entitlements
//
// Billing model: each study unlock ($2 quick / $5 deep) is charged to the
// saved card immediately by /api/checkout and recorded as a usage_event
// (billed = true). A user's first basic study is free (promo = true,
// amount 0). Per-tab generation events carry amount 0 (analytics only).
// The /api/billing/charge cron is retained but a no-op under this model —
// no unbilled billable usage accrues for it to collect.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Pricing ───────────────────────────────────────────────────────────────

export const PRICES = {
  QUICK_STUDY: 2.00,
  DEEP_DIVE:   5.00,
  ACADEMIC:    20.00,
} as const

// Default monthly cap (USD) applied to any user who hasn't set their own limit.
// Under the pay-at-unlock model the customer is charged immediately, so the
// platform no longer needs a default cap to bound pre-collection exposure —
// blocking a willing payer would just lose a sale. Default is now 0 (no
// platform cap; only a user's own self-set limit blocks). Set
// DEFAULT_MONTHLY_CAP in the env to re-enable a platform-wide default.
const DEFAULT_MONTHLY_CAP = Number(process.env.DEFAULT_MONTHLY_CAP) || 0

// ─── Unlock entitlements ───────────────────────────────────────────────────
// An unlock is a usage_event written by /api/checkout — either a paid charge
// (amount > 0) or the free first-study claim (promo = true, amount 0).
// 'deep' covers everything; 'quick' covers only quick (Haiku) tabs.

export interface UnlockStatus {
  quick: boolean
  deep: boolean
  academic: boolean
}

export async function getUnlockStatus(
  userId: string,
  passage: string
): Promise<UnlockStatus> {
  if (!supabase) return { quick: false, deep: false, academic: false }
  try {
    // The client sends the identical passage string to /api/checkout and
    // /api/tab, so an exact match is sufficient here. A paid charge
    // (amount > 0) or the free claim (promo) both count as an unlock.
    const { data } = await supabase
      .from('usage_events')
      .select('study_type')
      .eq('user_id', userId)
      .eq('passage', passage)
      // A paid charge (amount > 0), the free claim (promo), or a coupon
      // redemption (which may discount to $0) all count as an unlock.
      .or('amount.gt.0,promo.is.true,coupon_code.not.is.null')

    const types = new Set((data || []).map(e => e.study_type))
    // Tiers nest: an Academic unlock covers Deep + Quick; a Deep unlock covers Quick.
    return {
      academic: types.has('academic'),
      deep:     types.has('deep')  || types.has('academic'),
      quick:    types.has('quick') || types.has('deep') || types.has('academic'),
    }
  } catch {
    return { quick: false, deep: false, academic: false }
  }
}

// Has this account already claimed its one free basic study? The free claim is
// recorded as a usage_event with promo = true, so a single such row anywhere
// (any passage) means the per-account free study is used up. Fails closed
// (returns true → no free study) on error, so an outage can't mint free studies.
export async function hasClaimedFreeStudy(userId: string): Promise<boolean> {
  if (!supabase) return true
  try {
    const { data, error } = await supabase
      .from('usage_events')
      .select('id')
      .eq('user_id', userId)
      .eq('promo', true)
      .limit(1)
    if (error) throw error
    return (data?.length ?? 0) > 0
  } catch (err) {
    console.error('Free-study eligibility check failed:', err)
    return true
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
  studyType: 'quick' | 'deep' | 'academic'
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

// ─── Record a render failure ─────────────────────────────────────────────────
// A tab that errored or failed to parse for a signed-in user. Surfaced in the
// /admin dashboard so the affected (paid) study can be refunded. Fire-and-forget.

export async function recordRenderFailure(params: {
  userId: string
  passage: string
  roles: string[]
  tabId: string
  studyType: 'quick' | 'deep' | 'academic'
  error: string
}): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from('render_failures').insert({
      user_id:    params.userId,
      passage:    params.passage,
      roles:      params.roles,
      tab_id:     params.tabId,
      study_type: params.studyType,
      error:      params.error.slice(0, 500),
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Render-failure recording failed:', err)
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
