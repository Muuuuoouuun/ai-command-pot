-- replace with a valid auth user UUID
\set owner_id '00000000-0000-0000-0000-000000000001'

insert into subscriptions (owner_id, service_name, plan, monthly_cost, currency, renewal_date, billing_cycle, status, tags)
values
  (:'owner_id', 'OpenAI', 'Pro', 20, 'USD', now()::date + 5, 'monthly', 'active', '{ai,assistant}'),
  (:'owner_id', 'Vercel', 'Pro', 20, 'USD', now()::date + 12, 'monthly', 'active', '{hosting}');

insert into agents (owner_id, name, description, category, runner_type, favorite, config)
values
  (:'owner_id', 'Daily Summary Agent', 'Summarize latest notes and tasks.', 'productivity', 'llm_call', true, '{}'::jsonb),
  (:'owner_id', 'Webhook Deploy', 'Ping deployment webhook.', 'ops', 'webhook', true, '{"webhook_url":"https://example.com/hook"}'::jsonb);

insert into triggers (owner_id, agent_id, name, type, preset_params)
select :'owner_id', id, name || ' button', 'button', '{"source":"seed"}'::jsonb from agents where owner_id = :'owner_id';
