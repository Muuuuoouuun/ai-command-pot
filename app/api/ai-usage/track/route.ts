export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

const VALID_SERVICES = ['claude', 'codex', 'gemini', 'github', 'antigravity', 'other'] as const;
const VALID_STATUSES = ['success', 'error', 'rate_limited'] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service, tokens_input, tokens_output, cost_usd, status } = body;

    // Validate required fields
    if (!service || !VALID_SERVICES.includes(service)) {
      return NextResponse.json(
        { error: `service must be one of: ${VALID_SERVICES.join(', ')}` },
        { status: 400 }
      );
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    if (tokens_input !== undefined && (typeof tokens_input !== 'number' || tokens_input < 0)) {
      return NextResponse.json({ error: 'tokens_input must be a non-negative number' }, { status: 400 });
    }
    if (tokens_output !== undefined && (typeof tokens_output !== 'number' || tokens_output < 0)) {
      return NextResponse.json({ error: 'tokens_output must be a non-negative number' }, { status: 400 });
    }
    if (cost_usd !== undefined && (typeof cost_usd !== 'number' || cost_usd < 0)) {
      return NextResponse.json({ error: 'cost_usd must be a non-negative number' }, { status: 400 });
    }

    const payload = {
      service,
      model: typeof body.model === 'string' ? body.model : null,
      operation: typeof body.operation === 'string' ? body.operation : null,
      tokens_input: tokens_input ?? 0,
      tokens_output: tokens_output ?? 0,
      cost_usd: cost_usd ?? null,
      latency_ms: typeof body.latency_ms === 'number' ? body.latency_ms : null,
      status: status ?? 'success',
      metadata: body.metadata ?? null,
      owner_id: getOwner(),
    };

    const { data, error } = await supabaseServer()
      .from('ai_usage_events')
      .insert(payload)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
