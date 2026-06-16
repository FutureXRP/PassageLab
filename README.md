# PassageLab — Architecture & Build Guide

## What changed in this update

Complete architectural overhaul based on cost and product design decisions.

### Old architecture (replaced)
- SSE streaming, 19 tabs generated in parallel
- All tabs generated upfront regardless of what user needs
- Single `/api/study` endpoint
- No caching
- $0.50+ per study

### New architecture
- Single `/api/tab` endpoint — one tab, on demand, per click
- User sees Overview first (~10 seconds), clicks for more
- Supabase caching — popular passages served instantly at $0.00
- Prompt caching via Anthropic API — 90% discount on repeated input tokens
- Haiku routing for lightweight tabs — 2x faster, 25x cheaper
- $0.04–0.14 per study in API costs

---

## Pricing model

| Study type | User price | Your API cost | Margin |
|---|---|---|---|
| Quick Study | $1.00 | ~$0.04–0.06 | ~94% |
| Deep Dive | $2.00 | ~$0.10–0.14 | ~93% |
| Cached (any) | $1.00 or $2.00 | ~$0.00 | ~97% |

Billing: metered, billed on the 1st of each month via Stripe.
Users set their own spending limit. No surprise bills.

---

## Roles

Select up to 2 at a time:

| Role | Description |
|---|---|
| Pastor | Sermon prep — expository preaching focus |
| Theologian | Deep systematic and biblical theology |
| Teacher | Teaching and adult education |
| Small Group | Group discussion and application |
| Youth | Youth ministry lesson planning |
| Children | Children's ministry complete lesson |
| Student | Seminary research mode — academic writing |

Popular combinations shown as presets:
- ⭐ Pastor + Theologian — "Deep expository study"
- ⭐ Student + Theologian — "Seminary research mode"  
- ⭐ Teacher + Small Group — "Complete lesson prep"

---

## Tab architecture

### Quick Study tabs (generated on click, ~$1.00 total)

| Tab | Model | Tokens | Time | Roles |
|---|---|---|---|---|
| Overview | Haiku | 1500 | 8-10s | All |
| Scripture | Haiku | 1800 | 10-12s | All |
| Language | Sonnet | 2500 | 25-30s | Pastor, Theologian, Teacher, Student |
| History | Haiku | 1800 | 10-12s | All |
| Hermeneutics | Sonnet | 2000 | 20-25s | Pastor, Theologian, Teacher, Student |
| Theology | Sonnet | 2500 | 25-30s | Theologian, Student |
| Cross-Refs | Sonnet | 2000 | 20-25s | Theologian, Student |
| Christ | Sonnet | 1800 | 20-25s | All |
| Illustrations | Haiku | 2000 | 10-12s | Pastor, Teacher, SG, Youth, Children |
| Outline | Haiku | 2000 | 10-12s | Pastor, Teacher |
| Small Group | Haiku | 1800 | 10-12s | Small Group, Teacher |
| Youth | Haiku | 1500 | 8-10s | Youth |
| Children | Haiku | 1500 | 8-10s | Children |
| Essay Outline | Haiku | 2000 | 10-12s | Student |

### Deep Dive tabs (on-demand, contribute to $2.00 deep price)

| Tab | Model | Tokens | Time | Roles |
|---|---|---|---|---|
| Commentary | Sonnet | 3000 | 30-35s | Pastor, Theologian |
| Church Fathers | Sonnet | 2500 | 25-30s | Theologian, Student |
| Archaeology | Sonnet | 3000 | 30-35s | Pastor, Theologian, Student |
| Books | Haiku | 2000 | 10-12s | All |
| Sources & Citations | Haiku | 1500 | 8-10s | Student |

---

## File structure

```
lib/
  prompts.ts          — All tab prompts, role mapping, model routing, token budgets
  cache.ts            — Supabase cache read/write, key normalization
  usage.ts            — Usage tracking, spending limits, Stripe metered billing
  book-catalog.ts     — Accumulates Books-tab recommendations into a dedup'd catalog for later verification
  bible-api.ts        — Bible text fetching (existing)

app/api/
  tab/route.ts        — Single tab generation endpoint (NEW — replaces study/route.ts)

supabase/
  schema.sql          — Complete database schema

.env.example          — All required environment variables
```

---

## Phase 1 build order

### Step 1 — Supabase schema
Run `supabase/schema.sql` in your Supabase SQL editor.

### Step 2 — Supabase auth
Wire `@supabase/ssr` into Next.js middleware.
Create sign-up/sign-in pages.
Profiles created automatically via trigger.

### Step 3 — API endpoint
Deploy `app/api/tab/route.ts`.
Test with a single tab: `POST /api/tab { passage, roles, tabId }`.
Confirm caching works on second call.
Confirm Haiku vs Sonnet routing is correct.
Check Anthropic console for prompt cache hits.

### Step 4 — Frontend
Update study page to:
- Show role selector (up to 2, with preset suggestions)
- Show Overview tab immediately on load (auto-generate Overview + Scripture)
- Show remaining tabs as "click to generate" states
- Show spending meter in nav: "This month: $4.20"
- Show cached badge (⚡ Instant) on cache hits

### Step 5 — Stripe
No products needed in the Stripe Dashboard — billing is direct PaymentIntents:
unlocks are recorded as `usage_events`, summed monthly, and charged to the
saved card by the `/api/billing/charge` cron (1st of each month).

- Cards are saved via SetupIntent (`/api/setup-intent` → `confirmCardSetup`
  → `/api/setup-intent/confirm`), so SCA/3DS cards work off-session.
- Create a webhook endpoint (Dashboard → Developers → Webhooks) pointing at
  `/api/webhooks/stripe` with `payment_intent.succeeded`,
  `payment_intent.payment_failed`, `charge.dispute.created`; set the signing
  secret as `STRIPE_WEBHOOK_SECRET`.
- Set `CRON_SECRET` — the billing route refuses to run without it.
- The account page (`/account`) shows invoice history and the spending limit.

### Step 6 — Book catalog → verification → affiliate links
The Books tab never links to an unverified guess: the model can hallucinate
ISBNs and editions, so a link only appears once the book is confirmed against
a real catalog. Three stages, all wired:

1. **Accumulate.** Every freshly generated Books tab feeds `lib/book-catalog.ts`
   → the `book_catalog` table (dedup'd by normalized title|author, with
   `recommend_count` and the `passages` it was suggested for). The catalog grows
   on its own as studies are generated.
2. **Verify.** `app/api/verify-books/route.ts` works the most-recommended
   unverified rows, resolves each to a canonical ISBN-13 via Google Books
   (`lib/book-links.ts`, requires both title and author to match — a wrong link
   is worse than none), then sets `verified = true` with `canonical_isbn` and a
   `purchase_url`. Misses get a 30-day `last_checked_at` backoff. Runs daily via
   Vercel Cron (`vercel.json`) or on demand:
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
        "https://<domain>/api/verify-books?limit=25"
   ```
   Optional `GOOGLE_BOOKS_API_KEY` raises rate limits.
3. **Link + monetize.** `attachVerifiedLinks` (in `lib/book-catalog.ts`) adds a
   `purchase_url` to verified books at serve time in `/api/tab` — built fresh
   from the confirmed ISBN + `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG`, so the cached
   study stays link-free and links light up retroactively as books get verified.
   Sign up for Amazon Associates and set the tag; clicks can be logged to
   `affiliate_clicks`.

### Step 7 — Spending limits
Build spending limit UI in account page.
Test limit enforcement: set $2 limit, generate 3 studies, confirm block.

---

## Phase 2 build order

- Verified citation library (50 core books, blue checkmark system)
- Named role combination presets
- Study history in account
- Download study as markdown
- Professor/enterprise inquiry flow
- Mobile responsive polish

## Phase 3 build order

- Enterprise team accounts with per-user spending limits
- Seminary/institution partnerships
- Usage analytics admin dashboard
- Expanded verified citation library
- Logos partnership negotiation at scale

---

## Cost controls

### Prompt caching
Already wired in `app/api/tab/route.ts`.
The `anthropic-beta: prompt-caching-2024-07-31` header enables it.
System prompt and Bible text block are marked `cache_control: ephemeral`.
Watch the Anthropic console → Caching page for token reuse metrics.

### Haiku routing
Wired in `lib/prompts.ts` via `TAB_MODELS`.
Verify in logs: Haiku model string for Overview, Sonnet for Language.

### Supabase caching
Cache TTL: 90 days.
Bible text: indefinite (never changes).
Monitor `top_passages` view for cache hit rates.
After month 3, popular passages should hit 60%+.

---

## Affiliate revenue estimates

At 5,000 Deep Dive studies/month:
- Books tab generated each time
- 3% click-to-purchase conversion
- $15 average commission
- = ~$2,250/month passive

Logos commission: 20-30% on purchases often $200-2,000+
One seminary student buying a Logos library = $40-400 commission

---

## Student acquisition strategy

Target: Seminary students forming study habits they'll keep for 30 years.

Channels:
1. Professor outreach — one email, 30 students
2. Seminary bookstore recommendations
3. Campus ministry partnerships
4. "Research Mode" landing page at /students

Pricing: Same $1/$2 or 25% student discount with .edu verification.
Student → Pastor pipeline is your highest LTV customer segment.

---

## Unit economics at scale

| Monthly studies | Est. users | Revenue | API cost | Net profit | Margin |
|---|---|---|---|---|---|
| 500 | ~50 | $650 | $52 | $529 | 81% |
| 2,000 | ~150 | $2,600 | $208 | $2,267 | 87% |
| 10,000 | ~600 | $13,000 | $1,040 | $11,533 | 89% |
| 50,000 | ~2,500 | $65,000 | $5,200 | $57,865 | 89% |

Fixed costs: ~$50/month (Vercel Pro + Supabase Pro + domain)
Affiliate revenue adds 25-30% on top at scale.