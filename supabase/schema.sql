create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key,
  owner_id uuid not null,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  service_name text not null,
  plan text not null,
  monthly_cost numeric(12,2) not null default 0,
  currency text not null default 'USD',
  renewal_date date,
  billing_cycle text not null default 'monthly',
  account_email text,
  tags text[] default '{}',
  notes text,
  links text,
  status text not null default 'active',
  tokens_used_month bigint,
  cost_this_month numeric(12,2),
  last_updated_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists subscription_usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  subscription_id uuid references subscriptions(id) on delete cascade,
  month date not null,
  tokens_used bigint,
  cost numeric(12,2),
  created_at timestamptz default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  provider text not null,
  label text not null,
  encrypted_key text not null,
  iv text not null,
  tag text not null,
  last4 text not null,
  monthly_budget_note text,
  alert_threshold_note text,
  created_at timestamptz default now(),
  rotated_at timestamptz,
  is_active boolean default true
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  category text,
  runner_type text not null,
  input_schema jsonb default '{}'::jsonb,
  config jsonb default '{}'::jsonb,
  favorite boolean default false,
  created_at timestamptz default now()
);

create table if not exists triggers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  agent_id uuid references agents(id) on delete cascade,
  name text not null,
  type text not null,
  preset_params jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  agent_id uuid references agents(id) on delete set null,
  status text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_ms int,
  input jsonb,
  output jsonb,
  error text,
  cost_estimate numeric(12,4),
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_subscriptions_owner_created on subscriptions(owner_id, created_at desc);
create index if not exists idx_runs_owner_created on runs(owner_id, created_at desc);
create index if not exists idx_agents_owner_created on agents(owner_id, created_at desc);
create index if not exists idx_keys_owner_created on api_keys(owner_id, created_at desc);

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table subscription_usage_snapshots enable row level security;
alter table api_keys enable row level security;
alter table agents enable row level security;
alter table triggers enable row level security;
alter table runs enable row level security;
alter table audit_logs enable row level security;

create policy "owner access profiles" on profiles for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access subscriptions" on subscriptions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access snapshots" on subscription_usage_snapshots for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access api_keys" on api_keys for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access agents" on agents for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access triggers" on triggers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access runs" on runs for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access audit" on audit_logs for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table if not exists memos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  content text not null,
  is_processed boolean default false,
  created_at timestamptz default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  platform text not null, -- 'n8n', 'make'
  trigger_type text, -- 'webhook', 'schedule', 'event'
  is_active boolean default true,
  last_run_at timestamptz,
  success_rate numeric(5,2) default 100.0,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Separate Policies for New Tables
create policy "owner access memos" on memos for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access automations" on automations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table memos enable row level security;
alter table automations enable row level security;

-- New Indexes
create index if not exists idx_memos_owner_created on memos(owner_id, created_at desc);
create index if not exists idx_automations_owner_platform on automations(owner_id, platform);
