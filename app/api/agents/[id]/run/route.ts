import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

type RunnerResult = {
  status: 'success' | 'failed';
  output: unknown;
  error: string | null;
};

async function executeRun(agent: any, input: unknown): Promise<RunnerResult> {
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

  if (agent.runner_type === 'llm_call') {
    const provider: string = agent.config?.provider ?? 'openai';

    if (provider === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return { status: 'success', output: { mock: `Mock response for ${agent.name}`, input }, error: null };
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: agent.config?.model ?? 'claude-3-5-haiku-20241022',
          max_tokens: agent.config?.max_tokens ?? 1024,
          system: agent.config?.system_prompt ?? 'You are a helpful AI assistant.',
          messages: [{ role: 'user', content: typeof input === 'string' ? input : JSON.stringify(input) }]
        })
      });
      const json = await response.json();
      return {
        status: response.ok ? 'success' : 'failed',
        output: response.ok ? { text: json.content?.[0]?.text, raw: json } : json,
        error: response.ok ? null : JSON.stringify(json)
      };
    }

    // Default: OpenAI
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { status: 'success', output: { mock: `Mock response for ${agent.name}`, input }, error: null };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: agent.config?.model ?? 'gpt-4o-mini', messages: [{ role: 'user', content: JSON.stringify(input) }] })
    });

    const json = await response.json();
    return {
      status: response.ok ? 'success' : 'failed',
      output: json,
      error: response.ok ? null : JSON.stringify(json)
    };
  }

  return { status: 'failed', output: null, error: 'Unsupported runner type' };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 503 });
  }

  const ownerId = getOwner();
  const input = (await req.json()).input ?? {};
  const { data: agent } = await sb.from('agents').select('*').eq('owner_id', ownerId).eq('id', params.id).single();
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const start = new Date();
  const { data: run, error: runInsertError } = await sb.from('runs').insert({ owner_id: ownerId, agent_id: agent.id, status: 'running', started_at: start.toISOString(), input }).select('*').single();
  if (runInsertError || !run) return NextResponse.json({ error: runInsertError?.message ?? 'Run insert failed' }, { status: 400 });

  const result = await executeRun(agent, input);
  const end = new Date();
  const duration = end.getTime() - start.getTime();

  const { data, error } = await sb.from('runs').update({
    status: result.status,
    ended_at: end.toISOString(),
    duration_ms: duration,
    output: result.output,
    error: result.error
  }).eq('id', run.id).eq('owner_id', ownerId).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
