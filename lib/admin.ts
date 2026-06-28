// PassageLab — lib/admin.ts
// Server-side admin authorization. Admins are an allowlist of emails set in the
// ADMIN_EMAILS env var (comma-separated). The check runs only on the server
// (in /api/admin/* routes); the email list is never exposed to the client.

import { getAuthUser } from '@/lib/auth'

export function isAdminEmail(email?: string | null): boolean {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
}

// Returns the authenticated admin user, or null if not signed in / not an admin.
export async function requireAdmin(): Promise<{ id: string; email: string | null } | null> {
  const user = await getAuthUser()
  if (!user || !isAdminEmail(user.email)) return null
  return { id: user.id, email: user.email ?? null }
}
