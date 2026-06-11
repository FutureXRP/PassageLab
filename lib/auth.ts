// PassageLab — lib/auth.ts
// Server-side authentication helper for API routes.
// Reads the Supabase session from request cookies (set by the browser client).

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    // Supabase not configured or no valid session
    return null
  }
}
