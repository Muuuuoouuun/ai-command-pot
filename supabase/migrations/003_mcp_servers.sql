-- Migration 003: MCP Server Registry
-- Manages Model Context Protocol server configurations
-- Supports stdio (local process), http, and sse transport types

create table if not exists mcp_servers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,

  -- Identity
  name text not null,
  description text,

  -- Server type classification
  server_type text not null check (server_type in (
    'notion', 'figma', 'github', 'slack', 'linear', 'jira',
    'google-drive', 'custom-stdio', 'custom-http', 'custom-sse'
  )),

  -- Transport: how the MCP client connects to the server
  transport text not null default 'stdio' check (transport in ('stdio', 'http', 'sse')),

  -- stdio transport fields
  command text,           -- e.g. "npx"
  args text[],            -- e.g. ["@notionhq/notion-mcp-server"]
  working_dir text,

  -- http / sse transport fields
  endpoint_url text,

  -- Environment variable names (not values) needed by this server.
  -- Values are stored in the api_keys vault; this array is a hint for
  -- the operator to know which env vars must be set before enabling.
  env_var_names text[] default '{}',

  -- Optional references to encrypted vault keys that satisfy env vars.
  -- Array index corresponds to env_var_names index (may be sparse).
  vault_key_ids text[] default '{}',

  -- Capabilities advertised by this server (informational)
  capabilities text[] default '{}',  -- e.g. ['tools', 'resources', 'prompts']

  -- Arbitrary additional server config (headers, auth scheme, etc.)
  config jsonb default '{}'::jsonb,

  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_mcp_servers_owner on mcp_servers(owner_id, server_type);

alter table mcp_servers enable row level security;
create policy "owner access mcp_servers" on mcp_servers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
