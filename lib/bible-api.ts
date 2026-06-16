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

async function fetchTranslation(passage: string, translation: Translation): Promise<{ text: string; count: number }> {
  try {
    const encoded = encodeURIComponent(passage)
    const res = await fetch(`${BASE}/${encoded}?translation=${translation}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    })
    if (!res.ok) return { text: '', count: 0 }
    const data = await res.json()
    if (data.error) return { text: '', count: 0 }
    // Format verses nicely
    if (data.verses && data.verses.length > 0) {
      const text = data.verses
        .map((v: any) => `[${v.book_name} ${v.chapter}:${v.verse}] ${v.text.trim()}`)
        .join('\n')
      return { text, count: data.verses.length }
    }
    return { text: data.text?.trim() || '', count: 0 }
  } catch {
    return { text: '', count: 0 }
  }
}

export interface BibleText {
  kjv: string
  web: string
  asv: string
  ylt: string
  reference: string
  copyright: string
  // Exact number of verses in the passage (max across translations; 0 when the
  // reference couldn't be fetched). Used to cap passage size in /api/tab.
  verseCount: number
}

export async function fetchPassageText(passage: string): Promise<BibleText> {
  const [kjv, web, asv, ylt] = await Promise.all(
    TRANSLATIONS.map(t => fetchTranslation(passage, t))
  )

  return {
    kjv: kjv.text || `[${passage} — KJV not found]`,
    web: web.text || `[${passage} — WEB not found]`,
    asv: asv.text || `[${passage} — ASV not found]`,
    ylt: ylt.text || `[${passage} — YLT not found]`,
    reference: passage,
    copyright: 'KJV, WEB, ASV, and YLT are public domain translations.',
    verseCount: Math.max(kjv.count, web.count, asv.count, ylt.count, 0),
  }
}
