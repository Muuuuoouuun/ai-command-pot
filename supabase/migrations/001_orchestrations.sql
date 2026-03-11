-- Orchestrations: multi-agent pipeline definitions
create table if not exists orchestrations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  execution_mode text not null default 'sequential', -- 'sequential', 'parallel', 'mixed'
  is_active boolean default true,
  last_run_at timestamptz,
  last_run_status text, -- 'success', 'failed', 'running'
  total_runs int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orchestration runs: execution history for pipelines
create table if not exists orchestration_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  orchestration_id uuid references orchestrations(id) on delete cascade,
  status text not null default 'running', -- 'running', 'success', 'failed', 'cancelled'
  steps_state jsonb default '{}'::jsonb, -- per-step status/output
  input jsonb,
  final_output jsonb,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_ms int,
  error text
);

-- RLS
alter table orchestrations enable row level security;
alter table orchestration_runs enable row level security;

create policy "owner access orchestrations" on orchestrations for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner access orchestration_runs" on orchestration_runs for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Indexes
create index if not exists idx_orchestrations_owner on orchestrations(owner_id, created_at desc);
create index if not exists idx_orchestration_runs_owner on orchestration_runs(owner_id, started_at desc);
create index if not exists idx_orchestration_runs_orch on orchestration_runs(orchestration_id, started_at desc);
