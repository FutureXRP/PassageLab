-- PassageLab — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to run repeatedly: creates missing tables AND adds missing columns
-- to tables that already exist (see the migration section at the bottom).

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- One row per auth user, created automatically by trigger on signup.

create table if not exists public.profiles (
  id                        uuid primary key references auth.users (id) on delete cascade,
  email                     text,
  full_name                 text,
  stripe_customer_id        text,
  stripe_payment_method_id  text,
  stripe_subscription_id    text,
  card_last4                text,
  card_brand                text,
  card_verified_at          timestamptz,
  monthly_spending_limit    numeric(10,2),
  current_month_total       numeric(10,2) not null default 0,
  last_billed_at            timestamptz,
  last_bill_amount          numeric(10,2),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Usage events ────────────────────────────────────────────────────────────
-- One row per study unlock / tab generation; summed at month end for billing.

create table if not exists public.usage_events (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles (id) on delete set null,
  passage            text not null,
  roles              text[] not null default '{}',
  tab_ids            text[] not null default '{}',
  study_type         text not null check (study_type in ('quick', 'deep')),
  amount             numeric(10,2) not null default 0,
  cached             boolean not null default false,
  input_tokens       integer not null default 0,
  output_tokens      integer not null default 0,
  api_cost_estimate  numeric(10,6) not null default 0,
  billed             boolean not null default false,
  billed_at          timestamptz,
  billing_period     text,
  created_at         timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at);
create index if not exists usage_events_unbilled_idx
  on public.usage_events (user_id) where billed = false;
-- Entitlement lookups in /api/tab and /api/checkout
create index if not exists usage_events_user_passage_idx
  on public.usage_events (user_id, passage) where amount > 0;

-- ─── Billing records ─────────────────────────────────────────────────────────
-- One row per user per billing period, written by /api/billing/charge.

create table if not exists public.billing_records (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.profiles (id) on delete cascade,
  billing_period            text not null,           -- e.g. '2026-06'
  quick_study_count         integer not null default 0,
  deep_study_count          integer not null default 0,
  total_amount              numeric(10,2) not null default 0,
  stripe_payment_intent_id  text,
  status                    text not null default 'pending'
                            check (status in ('pending', 'paid', 'failed')),
  charged_at                timestamptz,
  created_at                timestamptz not null default now(),
  unique (user_id, billing_period)
);

-- ─── Study cache ─────────────────────────────────────────────────────────────
-- Generated tab content, keyed by passage + role combo + tab. 90-day TTL.

create table if not exists public.study_cache (
  cache_key     text primary key,
  passage_norm  text not null,
  role_combo    text not null,
  tab_id        text not null,
  content       jsonb not null,
  expires_at    timestamptz not null,
  hit_count     integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists study_cache_passage_idx on public.study_cache (passage_norm);

-- ─── Bible text cache ────────────────────────────────────────────────────────
-- Fetched translations never change — cached indefinitely.

create table if not exists public.bible_cache (
  passage_norm  text primary key,
  passage_raw   text not null,
  content       jsonb not null,
  created_at    timestamptz not null default now()
);

-- ─── Waitlist ────────────────────────────────────────────────────────────────
-- Unique email constraint is load-bearing: /api/waitlist treats error code
-- 23505 as "already signed up".

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text not null default 'landing',
  created_at  timestamptz not null default now()
);

-- ─── Saved studies ───────────────────────────────────────────────────────────
-- Generated tab content a user has saved to their account, so studies
-- survive across devices (localStorage is per-browser).

create table if not exists public.saved_studies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  passage     text not null,
  roles       text[] not null default '{}',
  roles_key   text not null,                 -- sorted roles, e.g. 'pastor+theologian'
  tabs        jsonb not null default '{}'::jsonb,   -- { tabId: content }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, passage, roles_key)
);

create index if not exists saved_studies_user_idx
  on public.saved_studies (user_id, updated_at desc);

-- ─── Affiliate clicks (Books tab) ────────────────────────────────────────────

create table if not exists public.affiliate_clicks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  passage     text,
  vendor      text,                                  -- amazon | logos | cbd
  book_title  text,
  created_at  timestamptz not null default now()
);

-- ─── Book catalog (accumulated from the Books tab) ───────────────────────────
-- Every freshly generated Books tab dumps its recommendations here, dedup'd by
-- a normalized title|author key. The Books tab itself no longer links out:
-- the model can hallucinate ISBNs/editions, so this is a staging catalog we
-- accumulate now, verify later (set `verified`, fill `canonical_isbn` /
-- `purchase_url` against a real catalog), and only then reintroduce accurate
-- links + affiliate revenue against the authenticated rows.

create table if not exists public.book_catalog (
  id               uuid primary key default gen_random_uuid(),
  book_key         text not null unique,           -- normalized "title|author" for dedup
  title            text not null,
  author           text,
  type             text,                           -- Commentary | Theology | Background | Language | Devotional
  isbn             text,                           -- best-effort from the model, UNVERIFIED
  level            text,                           -- Beginner | Intermediate | Advanced | Scholar
  passages         text[] not null default '{}',   -- distinct passages it's been recommended for (capped at 200)
  recommend_count  integer not null default 1,     -- times recommended across all studies
  verified         boolean not null default false, -- true once authenticated against a real catalog
  verified_at      timestamptz,
  canonical_isbn   text,                           -- authenticated ISBN-13 (filled by the verification step)
  purchase_url     text,                           -- authenticated link (affiliate tag added later)
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists book_catalog_count_idx
  on public.book_catalog (recommend_count desc);
-- Worklist for the future verification pass: rows still awaiting authentication
create index if not exists book_catalog_unverified_idx
  on public.book_catalog (recommend_count desc) where verified = false;

-- ─── RPC: increment monthly spend total ──────────────────────────────────────
-- Called by /api/checkout after recording a usage event.

create or replace function public.increment_monthly_total(
  p_user_id uuid,
  p_amount  numeric
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set current_month_total = coalesce(current_month_total, 0) + p_amount,
      updated_at          = now()
  where id = p_user_id;
end;
$$;

-- ─── RPC: increment cache hit counter ────────────────────────────────────────
-- Called by /api/tab on every cache hit.

create or replace function public.increment_cache_hit(p_cache_key text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.study_cache
  set hit_count  = hit_count + 1,
      updated_at = now()
  where cache_key = p_cache_key;
end;
$$;

-- ─── RPC: record book recommendations ────────────────────────────────────────
-- Called by /api/tab on every freshly generated Books tab. Takes the passage
-- and a JSON array of books, upserting each into book_catalog: new titles are
-- inserted, repeats bump recommend_count and append the passage (deduped,
-- capped at 200). One round-trip, race-safe via ON CONFLICT.

create or replace function public.record_book_recommendations(
  p_passage text,
  p_books   jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  b        jsonb;
  v_title  text;
  v_author text;
  v_type   text;
  v_isbn   text;
  v_level  text;
  v_key    text;
begin
  if p_books is null or jsonb_typeof(p_books) <> 'array' then
    return;
  end if;

  for b in select * from jsonb_array_elements(p_books)
  loop
    v_title := trim(coalesce(b ->> 'title', ''));
    continue when v_title = '';

    v_author := nullif(trim(coalesce(b ->> 'author', '')), '');
    v_type   := nullif(trim(coalesce(b ->> 'type',  '')), '');
    v_level  := nullif(trim(coalesce(b ->> 'level', '')), '');
    -- keep digits/X only, so "ISBN: 978-0-..." and "" both normalize cleanly
    v_isbn   := nullif(regexp_replace(coalesce(b ->> 'isbn', ''), '[^0-9Xx]', '', 'g'), '');
    -- dedup key: lowercased "title|author", collapsed whitespace
    v_key    := lower(regexp_replace(v_title || '|' || coalesce(v_author, ''), '\s+', ' ', 'g'));

    insert into public.book_catalog
      (book_key, title, author, type, isbn, level, passages, recommend_count)
    values
      (v_key, v_title, v_author, v_type, v_isbn, v_level,
       case when coalesce(p_passage, '') = '' then '{}'::text[] else array[p_passage] end,
       1)
    on conflict (book_key) do update set
      recommend_count = public.book_catalog.recommend_count + 1,
      last_seen_at    = now(),
      updated_at      = now(),
      -- enrich missing fields without overwriting what we already have
      isbn   = coalesce(public.book_catalog.isbn,   excluded.isbn),
      type   = coalesce(public.book_catalog.type,   excluded.type),
      level  = coalesce(public.book_catalog.level,  excluded.level),
      author = coalesce(public.book_catalog.author, excluded.author),
      passages = case
        when coalesce(p_passage, '') = ''                                    then public.book_catalog.passages
        when public.book_catalog.passages @> array[p_passage]                then public.book_catalog.passages
        when coalesce(array_length(public.book_catalog.passages, 1), 0) >= 200 then public.book_catalog.passages
        else public.book_catalog.passages || p_passage
      end;
  end loop;
end;
$$;

-- ─── Monitoring view: most-studied passages ──────────────────────────────────

create or replace view public.top_passages as
select
  passage_norm,
  count(*)            as tab_count,
  sum(hit_count)      as total_hits,
  max(updated_at)     as last_used
from public.study_cache
group by passage_norm
order by total_hits desc;

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- The API routes use the service-role key, which bypasses RLS.
-- These policies cover direct client access via the anon key.

alter table public.profiles         enable row level security;
alter table public.usage_events     enable row level security;
alter table public.billing_records  enable row level security;
alter table public.study_cache      enable row level security;
alter table public.bible_cache      enable row level security;
alter table public.waitlist         enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.book_catalog     enable row level security;
alter table public.saved_studies    enable row level security;

-- Users own their saved studies outright (read, save, update, delete)
drop policy if exists "saved_studies_select_own" on public.saved_studies;
create policy "saved_studies_select_own" on public.saved_studies
  for select using (auth.uid() = user_id);

drop policy if exists "saved_studies_insert_own" on public.saved_studies;
create policy "saved_studies_insert_own" on public.saved_studies
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_studies_update_own" on public.saved_studies;
create policy "saved_studies_update_own" on public.saved_studies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_studies_delete_own" on public.saved_studies;
create policy "saved_studies_delete_own" on public.saved_studies
  for delete using (auth.uid() = user_id);

-- Users can read and update their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Users can read their own usage and billing history
drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own" on public.usage_events
  for select using (auth.uid() = user_id);

drop policy if exists "billing_records_select_own" on public.billing_records;
create policy "billing_records_select_own" on public.billing_records
  for select using (auth.uid() = user_id);

-- study_cache, bible_cache, waitlist, affiliate_clicks, book_catalog: no
-- anon/user policies — service-role access only (RLS enabled with no policies
-- denies all other access).

-- ─── Migration: upgrade tables created by earlier setups ────────────────────
-- CREATE TABLE IF NOT EXISTS skips tables that already exist, so columns
-- added after the original launch must be added explicitly. Every statement
-- here is a no-op when the column/index already exists.

alter table public.profiles add column if not exists email                     text;
alter table public.profiles add column if not exists full_name                 text;
alter table public.profiles add column if not exists stripe_customer_id        text;
alter table public.profiles add column if not exists stripe_payment_method_id  text;
alter table public.profiles add column if not exists stripe_subscription_id    text;
alter table public.profiles add column if not exists card_last4                text;
alter table public.profiles add column if not exists card_brand                text;
alter table public.profiles add column if not exists card_verified_at          timestamptz;
alter table public.profiles add column if not exists monthly_spending_limit    numeric(10,2);
alter table public.profiles add column if not exists current_month_total       numeric(10,2) not null default 0;
alter table public.profiles add column if not exists last_billed_at            timestamptz;
alter table public.profiles add column if not exists last_bill_amount          numeric(10,2);
alter table public.profiles add column if not exists created_at                timestamptz not null default now();
alter table public.profiles add column if not exists updated_at                timestamptz not null default now();

alter table public.usage_events add column if not exists roles              text[] not null default '{}';
alter table public.usage_events add column if not exists tab_ids            text[] not null default '{}';
alter table public.usage_events add column if not exists amount             numeric(10,2) not null default 0;
alter table public.usage_events add column if not exists cached             boolean not null default false;
alter table public.usage_events add column if not exists input_tokens       integer not null default 0;
alter table public.usage_events add column if not exists output_tokens      integer not null default 0;
alter table public.usage_events add column if not exists api_cost_estimate  numeric(10,6) not null default 0;
alter table public.usage_events add column if not exists billed             boolean not null default false;
alter table public.usage_events add column if not exists billed_at          timestamptz;
alter table public.usage_events add column if not exists billing_period     text;
alter table public.usage_events add column if not exists created_at         timestamptz not null default now();

alter table public.billing_records add column if not exists quick_study_count        integer not null default 0;
alter table public.billing_records add column if not exists deep_study_count         integer not null default 0;
alter table public.billing_records add column if not exists stripe_payment_intent_id text;
alter table public.billing_records add column if not exists charged_at               timestamptz;
alter table public.billing_records add column if not exists created_at               timestamptz not null default now();

-- Upserts in the billing job rely on this unique pair
create unique index if not exists billing_records_user_period_uidx
  on public.billing_records (user_id, billing_period);

alter table public.study_cache add column if not exists hit_count  integer not null default 1;
alter table public.study_cache add column if not exists updated_at timestamptz not null default now();

alter table public.waitlist add column if not exists source text not null default 'landing';

-- ─── Least-privilege hardening ───────────────────────────────────────────────
-- Supabase grants anon/authenticated broad table privileges by default and
-- leans on RLS to gate rows. That's correct for the tables above, but a few
-- objects must be locked down explicitly. Every statement here is idempotent.
--
--  • Views bypass RLS, so anon could otherwise read them through the API.
--  • study_cache/bible_cache are only ever read by the server (service role),
--    so any public read policy on them is an unintended content leak.
--  • SECURITY DEFINER functions run with elevated rights — only the server
--    (service role) should be able to call them.
--  • profiles is editable by its owner, but a user must not be able to rewrite
--    billing/stripe/card columns; restrict UPDATE to the fields the app edits.

-- Monitoring view: keep it off the public API (service role / SQL editor only).
revoke all on public.top_passages from anon, authenticated;

-- Drop any public read policies that may have been added to the caches by
-- earlier setups — the app reads both only via the service role (bypasses RLS).
drop policy if exists "Anyone can read study cache" on public.study_cache;
drop policy if exists "Anyone can read bible cache" on public.bible_cache;

-- SECURITY DEFINER functions: server-side (service role) callers only.
revoke execute on function public.handle_new_user()                        from anon, authenticated;
revoke execute on function public.increment_monthly_total(uuid, numeric)   from anon, authenticated;
revoke execute on function public.increment_cache_hit(text)                from anon, authenticated;
revoke execute on function public.record_book_recommendations(text, jsonb) from anon, authenticated;

-- profiles: owners may edit only these fields. Billing/stripe/card columns and
-- current_month_total are written exclusively by the server (service role).
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, monthly_spending_limit) on public.profiles to authenticated;

-- Tell PostgREST (Supabase's API layer) to reload its schema cache so new
-- columns are visible immediately — fixes "Could not find the ... column
-- in the schema cache" without waiting for the automatic reload
notify pgrst, 'reload schema';
