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

-- study_cache, bible_cache, waitlist, affiliate_clicks: no anon/user policies —
-- service-role access only (RLS enabled with no policies denies all other access).

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

-- Tell PostgREST (Supabase's API layer) to reload its schema cache so new
-- columns are visible immediately — fixes "Could not find the ... column
-- in the schema cache" without waiting for the automatic reload
notify pgrst, 'reload schema';
