import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://passagelab.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,               changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/terms`,    changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy`,  changeFrequency: 'yearly', priority: 0.3 },
  ]
}
