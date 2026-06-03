import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, source = 'landing' } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim(), source })

    if (error) {
      // Unique constraint violation = already signed up
      if (error.code === '23505') {
        return NextResponse.json({ message: "You're already on the list!" })
      }
      throw error
    }

    return NextResponse.json({ message: "You're on the list! We'll be in touch." })
  } catch (err) {
    console.error('[/api/waitlist] error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
