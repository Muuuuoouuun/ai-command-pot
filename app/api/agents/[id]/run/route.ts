export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';
import { runClaudeAgent, runClaudeAgentWithMcp } from '@/lib/claude';
import { McpHttpClient } from '@/lib/mcp-client';

// Cost per 1M tokens (USD) — rough public rates
const COST_RATES: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':       { input: 5.00,   output: 25.00  },
  'claude-sonnet-4-6':     { input: 3.00,   output: 15.00  },
  'claude-haiku-4-5':      { input: 0.25,   output: 1.25   },
  'gpt-4o':                { input: 2.50,   output: 10.00  },
  'gpt-4o-mini':           { input: 0.15,   output: 0.60   },
  'gemini-2.0-flash':      { input: 0.075,  output: 0.30   },
  'gemini-1.5-pro':        { input: 1.25,   output: 5.00   },
  'gemini-1.5-flash':      { input: 0.075,  output: 0.30   },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_RATES[model] ?? { input: 1.00, output: 3.00 };
  return parseFloat(((inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output).toFixed(6));
}

type UsageInfo = {
  service: 'claude' | 'codex' | 'gemini' | 'antigravity' | 'other';
  model: string;
  inputTokens: number;
  outputTokens: number;
};

type RunnerResult = {
  status: 'success' | 'failed';
  output: unknown;
  error: string | null;
  cost_estimate?: number;
  _usage?: UsageInfo;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeRun(agent: any, input: unknown, sb: ReturnType<typeof supabaseServer>, ownerId: string): Promise<RunnerResult> {
  // ── Webhook ────────────────────────────────────────────────────────────────
  if (agent.runner_type === 'webhook') {
    const webhookUrl = agent.config?.webhook_url;
    if (!webhookUrl) return { status: 'failed', output: null, error: 'Missing webhook_url in agent config' };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const output = await response.text();
    return {
      status: response.ok ? 'success' : 'failed',
      output: { raw: output },
      error: response.ok ? null : output,
    };
  }

  // ── Claude ─────────────────────────────────────────────────────────────────
  if (agent.runner_type === 'claude') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return {
        status: 'success',
        output: { mock: `[Demo] Claude agent "${agent.name}" would process: ${JSON.stringify(input)}` },
        error: null,
      };
    }

    try {
      const model: string = agent.config?.model || 'claude-opus-4-6';
      const systemPrompt: string = agent.config?.system_prompt ||
        `You are ${agent.name}. ${agent.description || 'Execute the given task and return structured results.'}`;
      const maxTokens: number = agent.config?.max_tokens || 4096;

      const mcpServerIds: string[] = Array.isArray(agent.config?.mcp_server_ids)
        ? (agent.config.mcp_server_ids as string[])
        : [];

      let result: { output: string; inputTokens: number; outputTokens: number };

      if (mcpServerIds.length > 0) {
        const { data: mcpServers } = await sb
          .from('mcp_servers')
          .select('id, endpoint_url, transport')
          .in('id', mcpServerIds)
          .eq('owner_id', ownerId)
          .eq('is_active', true);

        const mcpClients = (mcpServers ?? [])
          .filter(s => (s.transport === 'http' || s.transport === 'sse') && s.endpoint_url)
          .map(s => new McpHttpClient(s.endpoint_url as string));

        result = await runClaudeAgentWithMcp(agent.name, systemPrompt, input, mcpClients, model, maxTokens);
      } else {
        result = await runClaudeAgent(agent.name, systemPrompt, input, model, maxTokens);
      }

      return {
        status: 'success',
        output: {
          text: result.output,
          usage: { input_tokens: result.inputTokens, output_tokens: result.outputTokens },
        },
        error: null,
        cost_estimate: estimateCost(model, result.inputTokens, result.outputTokens),
        _usage: { service: 'claude', model, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      };
    } catch (err) {
      return { status: 'failed', output: null, error: err instanceof Error ? err.message : 'Claude runner failed' };
    }
  }

  // ── OpenAI / Codex ─────────────────────────────────────────────────────────
  if (agent.runner_type === 'llm_call') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { status: 'success', output: { mock: `[Demo] OpenAI agent "${agent.name}"`, input }, error: null };
    }

    try {
      const model: string = agent.config?.model || 'gpt-4o-mini';
      const systemPrompt: string | undefined = agent.config?.system_prompt;
      const messages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: typeof input === 'string' ? input : JSON.stringify(input) },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, max_tokens: agent.config?.max_tokens || 4096 }),
      });

      const json = await response.json() as {
        choices?: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number };
        error?: { message: string };
      };

      if (!response.ok) {
        return { status: 'failed', output: json, error: json.error?.message ?? `HTTP ${response.status}` };
      }

      const inputTokens = json.usage?.prompt_tokens ?? 0;
      const outputTokens = json.usage?.completion_tokens ?? 0;

      return {
        status: 'success',
        output: {
          text: json.choices?.[0]?.message.content ?? '',
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        },
        error: null,
        cost_estimate: estimateCost(model, inputTokens, outputTokens),
        _usage: { service: 'codex', model, inputTokens, outputTokens },
      };
    } catch (err) {
      return { status: 'failed', output: null, error: err instanceof Error ? err.message : 'OpenAI runner failed' };
    }
  }

  // ── Gemini ─────────────────────────────────────────────────────────────────
  if (agent.runner_type === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return { status: 'success', output: { mock: `[Demo] Gemini agent "${agent.name}"`, input }, error: null };
    }

    try {
      const model: string = agent.config?.model || 'gemini-2.0-flash';
      const systemPrompt: string | undefined = agent.config?.system_prompt;
      const inputText = typeof input === 'string' ? input : JSON.stringify(input);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: inputText }] }],
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          generationConfig: { maxOutputTokens: agent.config?.max_tokens || 4096 },
        }),
      });

      const json = await response.json() as {
        candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
        usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
        error?: { message: string };
      };

      if (!response.ok) {
        return { status: 'failed', output: json, error: json.error?.message ?? `HTTP ${response.status}` };
      }

      const outputText = json.candidates?.[0]?.content.parts.map(p => p.text).join('') ?? '';
      const inputTokens = json.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = json.usageMetadata?.candidatesTokenCount ?? 0;

      return {
        status: 'success',
        output: {
          text: outputText,
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        },
        error: null,
        cost_estimate: estimateCost(model, inputTokens, outputTokens),
        _usage: { service: 'gemini', model, inputTokens, outputTokens },
      };
    } catch (err) {
      return { status: 'failed', output: null, error: err instanceof Error ? err.message : 'Gemini runner failed' };
    }
  }

  // ── Generic API call (Antigravity / custom REST) ────────────────────────────
  if (agent.runner_type === 'api_call') {
    const endpointUrl: string | undefined = agent.config?.endpoint_url;
    if (!endpointUrl) return { status: 'failed', output: null, error: 'Missing endpoint_url in agent config' };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      // Optional: Bearer token from env var named in config.auth_env_var
      const authEnvVar: string | undefined = agent.config?.auth_env_var;
      if (authEnvVar && process.env[authEnvVar]) {
        headers['Authorization'] = `Bearer ${process.env[authEnvVar]}`;
      }

      const response = await fetch(endpointUrl, {
        method: agent.config?.method || 'POST',
        headers,
        body: JSON.stringify(input),
      });

      const contentType = response.headers.get('content-type') ?? '';
      const output = contentType.includes('application/json')
        ? await response.json()
        : { raw: await response.text() };

      const service = (agent.config?.service as UsageInfo['service']) || 'antigravity';

      return {
        status: response.ok ? 'success' : 'failed',
        output,
        error: response.ok ? null : `HTTP ${response.status}`,
        _usage: { service, model: agent.config?.model || 'custom', inputTokens: 0, outputTokens: 0 },
      };
    } catch (err) {
      return { status: 'failed', output: null, error: err instanceof Error ? err.message : 'API call failed' };
    }
  }

  return { status: 'failed', output: null, error: `Unsupported runner type: ${agent.runner_type}` };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 503 });
  }

  const ownerId = getOwner();
  const body = (await req.json()) as { input?: unknown };
  const input = body.input ?? {};
  const { data: agent } = await sb.from('agents').select('*').eq('owner_id', ownerId).eq('id', params.id).single();
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const start = new Date();
  const { data: run, error: runInsertError } = await sb
    .from('runs')
    .insert({ owner_id: ownerId, agent_id: agent.id, status: 'running', started_at: start.toISOString(), input })
    .select('*')
    .single();
  if (runInsertError || !run) return NextResponse.json({ error: runInsertError?.message ?? 'Run insert failed' }, { status: 400 });

  const result = await executeRun(agent, input, sb, ownerId);
  const end = new Date();
  const duration = end.getTime() - start.getTime();

  // Persist run result
  const { data, error } = await sb.from('runs').update({
    status: result.status,
    ended_at: end.toISOString(),
    duration_ms: duration,
    output: result.output,
    error: result.error,
    cost_estimate: result.cost_estimate ?? null,
  }).eq('id', run.id).eq('owner_id', ownerId).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Auto-track AI usage (fire-and-forget — don't block response)
  if (result._usage) {
    const u = result._usage;
    sb.from('ai_usage_events').insert({
      owner_id: ownerId,
      service: u.service,
      model: u.model,
      input_tokens: u.inputTokens,
      output_tokens: u.outputTokens,
      cost_usd: result.cost_estimate ?? 0,
      status: result.status === 'success' ? 'success' : 'error',
      endpoint: `agent:${agent.id}`,
      latency_ms: duration,
    }).then(() => { /* intentionally ignored */ });
  }

  return NextResponse.json(data);
}
