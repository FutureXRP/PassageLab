import { NextRequest, NextResponse } from 'next/server'
import { generateStudy } from '@/lib/study-engine'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { passage } = await req.json()

    if (!passage || typeof passage !== 'string') {
      return NextResponse.json({ error: 'passage is required' }, { status: 400 })
    }

    const studyData = await generateStudy(passage)
    return NextResponse.json({ study: studyData, studyId: null })

  } catch (err) {
    console.error('[/api/study] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate study. Please try again.' },
      { status: 500 }
    )
  }
}