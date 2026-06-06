# PassageLab
## The Ultimate AI-Powered Research Platform for Bible Teachers, Preachers, Pastors, Small Group Leaders, and Students

**Live:** [passage-lab.vercel.app](https://passage-lab.vercel.app)

---

## Current Status — June 6, 2026

### ✅ Working
- Landing page with role selector (Pastor, Theologian, Teacher, Small Group, Youth, Children)
- Up to 2 roles selectable — tab union generated automatically
- Streaming architecture — parallel tab generation with progressive UI
- Tabs light up gold when ready, grayed out while generating
- 19 tabs total — only tabs relevant to selected roles are generated
- Bible text fetched from bible-api.com (KJV, WEB, ASV, YLT — public domain, no key needed)
- Amazon affiliate links on Book List tab
- Consistent Playfair Display + DM Sans typography throughout

### 🔧 Recent Fixes (this session)
- Language and Commentary tabs now use 8000 MAX_TOKENS (were failing at 4000)
- Heavy tabs (language, commentary, manuscript, fathers) run sequentially to avoid truncation
- Light tabs run in parallel batches of 3
- News, Outline, Manuscript tabs now correctly included when Pastor + Theologian selected
- Font inconsistency fixed — Playfair Display for headings, DM Sans for body everywhere
- Cross-refs tab empty data bug fixed

### 🚧 Next Steps
1. **Supabase** — set up auth, user profiles, usage tracking
2. **Stripe** — wire payments for Free / Church ($49) / Pro ($100) tiers
3. **Usage limits** — enforce study counts per plan per month
4. **Account page** — profile, subscription, upgrade/downgrade
5. **Study caching** — store completed studies in Supabase, time-based expiry
6. **ESV API** — add ESV via esv.org/api (free key, requires attribution)
7. **passagelab.app** — point custom domain to Vercel

---

## Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.3.8, TypeScript, React |
| Backend | Next.js API Routes (streaming SSE) |
| AI | Anthropic Claude Sonnet 4.6 |
| Bible Text | bible-api.com (free, no key) |
| Hosting | Vercel Pro ($20/mo, maxDuration=300) |
| Database | Supabase (schema written, not yet wired) |

### Key Files
| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page with role selector |
| `app/study/[passage]/page.tsx` | Study page — streaming SSE consumer |
| `app/api/study/route.ts` | Streaming API route — generates tabs in parallel |
| `lib/prompts.ts` | Per-tab prompt builders + role→tab mapping |
| `lib/bible-api.ts` | Fetches KJV/WEB/ASV/YLT from bible-api.com |
| `lib/study-engine.ts` | Stub — main logic now in route.ts |
| `types/index.ts` | TypeScript interfaces for all 19 tabs |

### Streaming Architecture
1. User selects roles + enters passage → hits Study
2. API route opens SSE stream
3. `init` event sent immediately with tab list
4. Bible text fetched in parallel from bible-api.com
5. Light tabs generated in parallel batches of 3 (4000 tokens each)
6. Heavy tabs (language, commentary, manuscript, fathers) generated sequentially (8000 tokens each)
7. Each tab sends `tab_start` then `tab_done` events as it completes
8. Frontend renders tabs progressively — tabs become clickable as they complete

### Role → Tab Mapping
| Role | Tabs Generated |
|------|---------------|
| Pastor | overview, scripture, language, history, archaeology, christ, commentary, illustrations, outline, manuscript |
| Theologian | overview, scripture, language, history, archaeology, theology, crossref, christ, commentary, fathers, books, news |
| Teacher | overview, scripture, history, christ, commentary, illustrations, outline, smallgroup, books |
| Small Group | overview, scripture, history, christ, illustrations, smallgroup |
| Youth | overview, scripture, history, christ, illustrations, youth |
| Children | overview, scripture, illustrations, children |

---

## Pricing
| Plan | Price | Studies/Month |
|------|-------|---------------|
| Free | $0 | 5 |
| Church | $49/mo | 50 |
| Pro | $100/mo | Unlimited |

---

## API Cost
| Tab Type | MAX_TOKENS | Est. Cost (Sonnet) |
|----------|-----------|-------------------|
| Light tabs | 4,000 | ~$0.02 each |
| Heavy tabs | 8,000 | ~$0.06 each |
| Typical Pastor study (10 tabs) | — | ~$0.28 |
| Typical Pastor+Theologian (15 tabs) | — | ~$0.45 |

---

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_AMAZON_TAG=passagelab-20
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://passagelab.app
```

---

## Local Development
```bash
git clone https://github.com/FutureXRP/PassageLab.git
cd PassageLab
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

---

## Supabase Schema (written, not yet run)
Location: `supabase/schema.sql`
Tables: `waitlist`, `profiles`, `studies`, `usage`
RLS policies written. Ready to deploy once Supabase project created.

---

## Mission
> Equip every Bible teacher on earth with world-class study tools so they can teach God's Word with greater clarity, confidence, depth, and faithfulness.