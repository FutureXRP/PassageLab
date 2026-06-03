import { NextRequest, NextResponse } from 'next/server'
import { generateStudy } from '@/lib/study-engine'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { FREE_TIER_LIMIT } from '@/types'

export const maxDuration = 60 // Vercel function timeout (seconds)

export async function POST(req: NextRequest) {
  try {
    const { passage } = await req.json()

    if (!passage || typeof passage !== 'string') {
      return NextResponse.json({ error: 'passage is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ─── FREE TIER ENFORCEMENT ────────────────────────────────
    if (user) {
      const month = new Date().toISOString().slice(0, 7) // "2026-06"
      const serviceClient = createServiceClient()

      const { data: usage } = await serviceClient
        .from('usage')
        .select('study_count')
        .eq('user_id', user.id)
        .eq('month', month)
        .single()

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      const isPro = profile?.plan === 'pro'
      const monthlyCount = usage?.study_count ?? 0

      if (!isPro && monthlyCount >= FREE_TIER_LIMIT) {
        return NextResponse.json(
          {
            error: 'free_limit_reached',
            message: `You've used all ${FREE_TIER_LIMIT} free studies this month. Upgrade to Pro for unlimited access.`,
          },
          { status: 403 }
        )
      }
    }

    // ─── GENERATE STUDY ───────────────────────────────────────
    const studyData = await generateStudy(passage)

    // ─── SAVE TO SUPABASE (authenticated users only) ──────────
    let studyId: string | null = null

    if (user) {
      const serviceClient = createServiceClient()
      const month = new Date().toISOString().slice(0, 7)

      // Save the study
      const { data: saved } = await serviceClient
        .from('studies')
        .insert({ user_id: user.id, passage, data: studyData })
        .select('id')
        .single()

      studyId = saved?.id ?? null

      // Upsert usage count
      await serviceClient.from('usage').upsert(
        { user_id: user.id, month, study_count: 1 },
        {
          onConflict: 'user_id,month',
          ignoreDuplicates: false,
        }
      )

      // Increment if row existed
      await serviceClient.rpc('increment_usage', {
        p_user_id: user.id,
        p_month: month,
      })
    }

    return NextResponse.json({ study: studyData, studyId })
  } catch (err) {
    console.error('[/api/study] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate study. Please try again.' },
      { status: 500 }
    )
  }
}
