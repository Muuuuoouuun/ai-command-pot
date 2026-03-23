import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';
import { runClaudeAgent, runClaudeAgentWithMcp } from '@/lib/claude';
import { McpHttpClient } from '@/lib/mcp-client';

type RunnerResult = {
  status: 'success' | 'failed';
  output: unknown;
  error: string | null;
  cost_estimate?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeRun(agent: any, input: unknown, sb: ReturnType<typeof supabaseServer>, ownerId: string): Promise<RunnerResult> {
  if (agent.runner_type === 'webhook') {
    const webhookUrl = agent.config?.webhook_url;
    if (!webhookUrl) return { status: 'failed', output: null, error: 'Missing webhook_url in agent config' };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const output = await response.text();
    return {
      status: response.ok ? 'success' : 'failed',
      output: { raw: output },
      error: response.ok ? null : output
    };
  }

  if (agent.runner_type === 'claude') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return {
        status: 'success',
        output: { mock: `[Demo] Claude agent "${agent.name}" would process: ${JSON.stringify(input)}` },
        error: null
      };
    }

    try {
      const model = agent.config?.model || 'claude-opus-4-6';
      const systemPrompt = agent.config?.system_prompt ||
        `You are ${agent.name}. ${agent.description || 'Execute the given task and return structured results.'}`;
      const maxTokens: number = agent.config?.max_tokens || 4096;

      // If the agent has mcp_server_ids configured, wire up HTTP/SSE MCP clients
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

      // Estimate cost: $5/1M input tokens, $25/1M output tokens for Opus 4.6
      const inputCost = (result.inputTokens / 1_000_000) * 5;
      const outputCost = (result.outputTokens / 1_000_000) * 25;

      return {
        status: 'success',
        output: {
          text: result.output,
          usage: { input_tokens: result.inputTokens, output_tokens: result.outputTokens }
        },
        error: null,
        cost_estimate: parseFloat((inputCost + outputCost).toFixed(6))
      };
    } catch (err) {
      return {
        status: 'failed',
        output: null,
        error: err instanceof Error ? err.message : 'Claude runner failed'
      };
    }
  }

  if (agent.runner_type === 'llm_call') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { status: 'success', output: { mock: `Mock response for ${agent.name}`, input }, error: null };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: JSON.stringify(input) }] })
    });

    const json = await response.json();
    return {
      status: response.ok ? 'success' : 'failed',
      output: json,
      error: response.ok ? null : JSON.stringify(json)
    };
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

  const { data, error } = await sb.from('runs').update({
    status: result.status,
    ended_at: end.toISOString(),
    duration_ms: duration,
    output: result.output,
    error: result.error,
    cost_estimate: result.cost_estimate ?? null
  }).eq('id', run.id).eq('owner_id', ownerId).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
