// PassageLab — cache.ts
// Supabase-backed cache for generated study tabs
// Gracefully degrades when Supabase is not configured

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const CACHE_TTL_DAYS = 90

// ─── Supabase client (optional) ───────────────────────────────────────────
// Cache is skipped entirely when Supabase env vars are not set
// This allows the app to run and generate studies without a database

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ─── Key normalization ─────────────────────────────────────────────────────

export function normalizePassage(passage: string): string {
  return passage
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*:\s*(\d)/g, '$1:$2')   // normalize 3 : 16 → 3:16
    .replace(/(\d)\s*-\s*(\d)/g, '$1-$2')   // normalize 3 - 16 → 3-16
}

export function normalizeRoles(roles: string[]): string {
  return [...roles].sort().join('+')
}

export function buildCacheKey(
  passage: string,
  roles: string[],
  tabId: string
): string {
  const p = normalizePassage(passage)
  const r = normalizeRoles(roles)
  return `${p}::${r}::${tabId}`
}

// ─── Cache operations ──────────────────────────────────────────────────────

export async function getCachedTab(
  passage: string,
  roles: string[],
  tabId: string
): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  if (!supabase) return null   // No Supabase — skip cache

  try {
    const cacheKey = buildCacheKey(passage, roles, tabId)

    const { data, error } = await supabase
      .from('study_cache')
      .select('content, expires_at')
      .eq('cache_key', cacheKey)
      .single()

    if (error || !data) return null

    if (new Date(data.expires_at) < new Date()) {
      supabase.from('study_cache').delete().eq('cache_key', cacheKey).then(() => {})
      return null
    }

    return data.content as Record<string, unknown>
  } catch {
    return null
  }
}

export async function setCachedTab(
  passage: string,
  roles: string[],
  tabId: string,
  content: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return   // No Supabase — skip cache write

  try {
    const cacheKey = buildCacheKey(passage, roles, tabId)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS)

    await supabase
      .from('study_cache')
      .upsert({
        cache_key:    cacheKey,
        passage_norm: normalizePassage(passage),
        role_combo:   normalizeRoles(roles),
        tab_id:       tabId,
        content:      content,
        expires_at:   expiresAt.toISOString(),
        hit_count:    1,
        created_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'cache_key', ignoreDuplicates: false })
  } catch (err) {
    console.error('Cache write failed:', err)
  }
}

export async function incrementCacheHit(
  passage: string,
  roles: string[],
  tabId: string
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    const cacheKey = buildCacheKey(passage, roles, tabId)
    await supabase.rpc('increment_cache_hit', { p_cache_key: cacheKey })
  } catch {
    // Non-fatal
  }
}

// ─── Bible text cache ──────────────────────────────────────────────────────

export async function getCachedBibleText(
  passage: string
): Promise<Record<string, string> | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('bible_cache')
      .select('content')
      .eq('passage_norm', normalizePassage(passage))
      .single()

    if (error || !data) return null
    return data.content as Record<string, string>
  } catch {
    return null
  }
}

export async function setCachedBibleText(
  passage: string,
  content: Record<string, string>
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase
      .from('bible_cache')
      .upsert({
        passage_norm: normalizePassage(passage),
        passage_raw:  passage,
        content:      content,
        created_at:   new Date().toISOString(),
      }, { onConflict: 'passage_norm', ignoreDuplicates: true })
  } catch {
    // Non-fatal
  }
}

// ─── Verified-source search cache ────────────────────────────────────────────
// Results from the free scholarly APIs (OpenAlex/Crossref/Google Books). They
// change slowly, so a 30-day TTL keeps repeat lookups instant and polite to
// the upstream APIs.

const SOURCE_CACHE_TTL_DAYS = 30

export async function getCachedSources(
  passage: string
): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('source_search_cache')
      .select('content, expires_at')
      .eq('passage_norm', normalizePassage(passage))
      .single()
    if (error || !data) return null
    if (new Date(data.expires_at) < new Date()) {
      supabase.from('source_search_cache').delete().eq('passage_norm', normalizePassage(passage)).then(() => {})
      return null
    }
    return data.content as Record<string, unknown>
  } catch {
    return null
  }
}

export async function setCachedSources(
  passage: string,
  content: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SOURCE_CACHE_TTL_DAYS)
    await supabase
      .from('source_search_cache')
      .upsert({
        passage_norm: normalizePassage(passage),
        content,
        expires_at:   expiresAt.toISOString(),
        created_at:   new Date().toISOString(),
      }, { onConflict: 'passage_norm', ignoreDuplicates: false })
  } catch {
    // Non-fatal
  }
}