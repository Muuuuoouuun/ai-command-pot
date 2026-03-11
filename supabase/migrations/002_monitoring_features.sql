-- Migration 002: Monitoring Features
-- AI Usage Dashboard, Agent Visual Map, Skills/Tips/Reports

-- ============================================================
-- FEATURE 1: Automation Monitoring (extends existing automations)
-- ============================================================

create table if not exists automation_executions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  automation_id uuid references automations(id) on delete set null,
  workflow_name text,
  status text not null check (status in ('success', 'failure', 'pending', 'timeout')),
  payload jsonb,
  response_body jsonb,
  error_message text,
  duration_ms integer,
  triggered_at timestamptz default now()
);

create table if not exists automation_alert_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  automation_id uuid references automations(id) on delete cascade,
  condition text not null check (condition in ('on_failure', 'failure_rate_threshold', 'no_activity')),
  threshold_value numeric,
  threshold_window_minutes integer default 60,
  notification_channel text check (notification_channel in ('email', 'slack', 'webhook')),
  notification_target text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_automation_executions_owner on automation_executions(owner_id, triggered_at desc);
create index if not exists idx_automation_executions_status on automation_executions(status, triggered_at desc);
create index if not exists idx_automation_alert_rules_owner on automation_alert_rules(owner_id);

alter table automation_executions enable row level security;
alter table automation_alert_rules enable row level security;

create policy "owner access automation_executions" on automation_executions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access automation_alert_rules" on automation_alert_rules for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============================================================
-- FEATURE 2: AI Service Usage Dashboard
-- ============================================================

create table if not exists ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  service text not null check (service in ('claude', 'codex', 'gemini', 'github', 'antigravity', 'other')),
  model text,
  operation text,
  tokens_input integer default 0,
  tokens_output integer default 0,
  cost_usd numeric(10,6),
  latency_ms integer,
  status text check (status in ('success', 'error', 'rate_limited')),
  error_code text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_usage_daily (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  date date not null,
  service text not null,
  model text,
  total_calls integer default 0,
  total_tokens_input bigint default 0,
  total_tokens_output bigint default 0,
  total_cost_usd numeric(12,6) default 0,
  error_count integer default 0,
  unique (date, service, model, owner_id)
);

create table if not exists ai_service_budgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  service text not null,
  budget_type text check (budget_type in ('daily', 'monthly')),
  budget_usd numeric(10,2),
  token_limit bigint,
  alert_threshold_percent integer default 80,
  created_at timestamptz default now(),
  unique (service, budget_type, owner_id)
);

create index if not exists idx_ai_usage_events_owner_service on ai_usage_events(owner_id, service, created_at desc);
create index if not exists idx_ai_usage_daily_owner_date on ai_usage_daily(owner_id, date desc, service);

alter table ai_usage_events enable row level security;
alter table ai_usage_daily enable row level security;
alter table ai_service_budgets enable row level security;

create policy "owner access ai_usage_events" on ai_usage_events for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access ai_usage_daily" on ai_usage_daily for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access ai_service_budgets" on ai_service_budgets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============================================================
-- FEATURE 3: Agent Visual Map
-- ============================================================

create table if not exists agent_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  agent_id uuid references agents(id) on delete cascade,
  status text not null check (status in ('idle', 'working', 'waiting', 'error', 'offline')),
  current_task text,
  task_metadata jsonb,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Add visual map fields to existing agents table
alter table agents add column if not exists workspace_position jsonb;
alter table agents add column if not exists avatar_config jsonb;
alter table agents add column if not exists visual_status text check (visual_status in ('idle', 'working', 'waiting', 'error', 'offline')) default 'offline';

create index if not exists idx_agent_activities_owner_agent on agent_activities(owner_id, agent_id, started_at desc);

alter table agent_activities enable row level security;
create policy "owner access agent_activities" on agent_activities for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============================================================
-- FEATURE 4: Skills / Tips / Reports
-- ============================================================

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  content_md text not null,
  tags text[] default '{}',
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  related_service text,
  view_count integer default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  service text,
  tip_type text check (tip_type in ('prompt', 'workflow', 'cost', 'security')),
  is_featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists usage_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  report_type text not null check (report_type in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  report_data jsonb not null default '{}'::jsonb,
  generated_at timestamptz default now(),
  unique (report_type, period_start, owner_id)
);

create table if not exists user_skill_bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  skill_id uuid references skills(id) on delete cascade,
  created_at timestamptz default now(),
  unique (owner_id, skill_id)
);

create index if not exists idx_skills_category on skills(category);
create index if not exists idx_skills_tags on skills using gin(tags);
create index if not exists idx_tips_service on tips(service, is_featured);
create index if not exists idx_usage_reports_owner on usage_reports(owner_id, report_type, period_start desc);
create index if not exists idx_skill_bookmarks_owner on user_skill_bookmarks(owner_id);

alter table usage_reports enable row level security;
alter table user_skill_bookmarks enable row level security;

create policy "owner access usage_reports" on usage_reports for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access skill_bookmarks" on user_skill_bookmarks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Skills and tips are globally readable (no owner_id)
alter table skills enable row level security;
alter table tips enable row level security;
create policy "public read skills" on skills for select using (is_published = true);
create policy "public read tips" on tips for select using (true);

-- Seed skills
insert into skills (title, slug, category, content_md, tags, difficulty, related_service) values
('Writing Effective System Prompts', 'effective-system-prompts', 'Prompt Engineering',
'# Writing Effective System Prompts

A system prompt sets the context and persona for your AI assistant. Here are the key principles:

## Be Specific About Role
Instead of "You are a helpful assistant", write:
"You are a senior software engineer specializing in TypeScript and React. You review code with a focus on performance, security, and maintainability."

## Define Output Format
Specify the exact format you want:
```
Always respond with:
1. A brief summary (1-2 sentences)
2. Detailed explanation
3. Code example (if applicable)
```

## Set Constraints
Explicitly state what the model should NOT do:
- Do not suggest external libraries unless asked
- Do not refactor code that was not mentioned in the request

## Include Examples
Few-shot examples dramatically improve consistency for structured outputs.',
array['prompts', 'system-prompt', 'best-practices'], 'beginner', 'claude'),

('Reducing Token Costs with Caching', 'token-caching-strategies', 'Cost Optimization',
'# Reducing Token Costs with Prompt Caching

Claude supports prompt caching which can reduce costs by 90% for repeated context.

## How It Works
Cache breakpoints mark sections of your prompt to cache. Subsequent requests reuse cached content without re-processing.

## Implementation
```typescript
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  system: [
    {
      type: "text",
      text: largeSystemPrompt,
      cache_control: { type: "ephemeral" }
    }
  ],
  messages: [{ role: "user", content: userMessage }]
});
```

## Best Practices
- Cache stable content (system prompts, large documents)
- Cache breakpoints have a 5-minute TTL minimum
- Use for repeated conversations with the same context
- Minimum 1024 tokens for cache to be effective',
array['cost', 'caching', 'optimization', 'tokens'], 'intermediate', 'claude'),

('Building Multi-Step Workflows', 'multi-step-workflows', 'Workflow Automation',
'# Building Multi-Step AI Workflows

Complex tasks benefit from breaking them into specialized agent steps.

## Sequential Chaining
Pass output from one agent as input to the next:
```
Step 1: Research Agent → finds information
Step 2: Analysis Agent → processes findings
Step 3: Writer Agent → formats final output
```

## Parallel Processing
Run independent tasks simultaneously:
```typescript
const [research, competitors, trends] = await Promise.all([
  runResearchAgent(topic),
  runCompetitorAgent(topic),
  runTrendsAgent(topic)
]);
```

## Error Handling
Always implement retry logic and fallbacks:
- Retry on rate limits with exponential backoff
- Have fallback models (e.g., Haiku if Opus times out)
- Log all failures for debugging',
array['workflow', 'orchestration', 'agents', 'automation'], 'intermediate', null),

('Structured Output with JSON Mode', 'structured-output-json', 'Prompt Engineering',
'# Getting Reliable Structured Output

Force consistent JSON output for programmatic use.

## Using Tool Use for JSON
The most reliable way to get structured output:
```typescript
const response = await anthropic.messages.create({
  tools: [{
    name: "extract_data",
    description: "Extract structured data from the text",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        score: { type: "number", minimum: 0, maximum: 100 },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["name", "score"]
    }
  }],
  tool_choice: { type: "tool", name: "extract_data" }
});
```

## Validation
Always validate and parse the response:
```typescript
const toolUse = response.content.find(b => b.type === "tool_use");
const data = toolUse?.input; // Type-safe structured data
```',
array['json', 'structured-output', 'tool-use', 'parsing'], 'intermediate', 'claude'),

('Gemini vs Claude: When to Use Which', 'gemini-vs-claude', 'Service Comparison',
'# Choosing Between Gemini and Claude

Both are powerful but excel in different areas.

## Claude Strengths
- **Long context**: Up to 200K tokens, handles entire codebases
- **Code generation**: Consistently produces clean, working code
- **Instruction following**: Excellent at following complex, multi-part instructions
- **Safety**: Built-in harmful content filtering

## Gemini Strengths
- **Multimodal**: Native image, audio, and video understanding
- **Speed**: Gemini Flash is extremely fast and cheap
- **Google integration**: Works natively with Google Workspace data
- **Real-time data**: Connected to current web information

## Decision Guide
| Task | Recommendation |
|------|---------------|
| Code review | Claude |
| Image analysis | Gemini |
| Long document Q&A | Claude |
| Quick classification | Gemini Flash |
| Complex reasoning | Claude Opus |
| High-volume processing | Gemini Flash |',
array['comparison', 'gemini', 'claude', 'strategy'], 'beginner', null),

('Rate Limit Handling Best Practices', 'rate-limit-handling', 'Reliability',
'# Handling AI API Rate Limits

Production systems must handle rate limits gracefully.

## Exponential Backoff
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 4
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Rate Limit Strategies
- **Request queuing**: Use a queue to limit concurrent requests
- **Token budgeting**: Track and enforce daily token limits
- **Model fallback**: Fall back to cheaper/faster model when primary is rate limited
- **Caching**: Cache identical requests to avoid duplicate API calls',
array['rate-limits', 'reliability', 'error-handling', 'production'], 'advanced', null)
on conflict (slug) do nothing;

-- Seed tips
insert into tips (title, body, service, tip_type, is_featured) values
('Use temperature=0 for deterministic outputs', 'When you need consistent, reproducible results (like data extraction or code generation), set temperature to 0. This makes the model deterministic and easier to test.', 'claude', 'prompt', true),
('Batch similar requests to reduce latency', 'Group multiple small AI tasks into a single prompt instead of making separate API calls. This reduces latency and often costs less due to shared context.', null, 'workflow', true),
('Monitor your daily token spend', 'Set up daily alerts at 80% of your budget. AI costs can spike unexpectedly when a workflow loops or a large document gets processed repeatedly.', null, 'cost', true),
('Rotate API keys every 90 days', 'Even for personal projects, rotate API keys quarterly. Store them encrypted (never in code), and use separate keys for dev and production environments.', null, 'security', false),
('Use Claude Haiku for classification tasks', 'For simple classification, sentiment analysis, or routing decisions, Claude Haiku is 10x cheaper than Sonnet with comparable accuracy on straightforward tasks.', 'claude', 'cost', true),
('Chain prompts instead of one mega-prompt', 'A sequence of focused prompts (research → analyze → write) produces better results than a single complex prompt. Each step can validate the previous one.', null, 'prompt', false),
('Enable streaming for better UX', 'Use streaming API responses to show progress immediately. Users perceive streaming responses as faster even when total time is similar.', 'claude', 'workflow', false),
('Test with adversarial inputs', 'Before deploying AI features, test with edge cases: empty inputs, very long inputs, inputs in different languages, and attempts to override your system prompt.', null, 'security', true)
on conflict do nothing;
