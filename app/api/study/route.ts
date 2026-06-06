import { NextRequest, NextResponse } from 'next/server'
import { generateStudy } from '@/lib/study-engine'
import type { Role } from '@/lib/prompts'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { passage, roles } = await req.json()

    if (!passage || typeof passage !== 'string') {
      return NextResponse.json({ error: 'passage is required' }, { status: 400 })
    }

    const validRoles: Role[] = ['pastor','theologian','teacher','smallgroup','youth','children']
    const selectedRoles: Role[] = Array.isArray(roles)
      ? roles.filter((r: string) => validRoles.includes(r as Role)) as Role[]
      : ['pastor']

    const finalRoles = selectedRoles.length > 0 ? selectedRoles : ['pastor'] as Role[]

    const studyData = await generateStudy(passage, finalRoles)
    return NextResponse.json({ study: studyData, studyId: null })

  } catch (err) {
    console.error('[/api/study] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate study. Please try again.' },
      { status: 500 }
    )
  }
}