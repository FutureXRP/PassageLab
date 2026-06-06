// lib/bible-api.ts
// Uses bible-api.com — free, no key, no signup, public domain translations only

const BASE = 'https://bible-api.com'

const TRANSLATIONS = ['kjv', 'web', 'asv', 'ylt'] as const
type Translation = typeof TRANSLATIONS[number]

const TRANSLATION_LABELS: Record<Translation, string> = {
  kjv: 'King James Version',
  web: 'World English Bible',
  asv: 'American Standard Version',
  ylt: "Young's Literal Translation",
}

async function fetchTranslation(passage: string, translation: Translation): Promise<string> {
  try {
    const encoded = encodeURIComponent(passage)
    const res = await fetch(`${BASE}/${encoded}?translation=${translation}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    })
    if (!res.ok) return ''
    const data = await res.json()
    if (data.error) return ''
    // Format verses nicely
    if (data.verses && data.verses.length > 0) {
      return data.verses
        .map((v: any) => `[${v.book_name} ${v.chapter}:${v.verse}] ${v.text.trim()}`)
        .join('\n')
    }
    return data.text?.trim() || ''
  } catch {
    return ''
  }
}

export interface BibleText {
  kjv: string
  web: string
  asv: string
  ylt: string
  reference: string
  copyright: string
}

export async function fetchPassageText(passage: string): Promise<BibleText> {
  const [kjv, web, asv, ylt] = await Promise.all(
    TRANSLATIONS.map(t => fetchTranslation(passage, t))
  )

  return {
    kjv: kjv || `[${passage} — KJV not found]`,
    web: web || `[${passage} — WEB not found]`,
    asv: asv || `[${passage} — ASV not found]`,
    ylt: ylt || `[${passage} — YLT not found]`,
    reference: passage,
    copyright: 'KJV, WEB, ASV, and YLT are public domain translations.',
  }
}
