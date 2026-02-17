import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: Request, { params }: { params: { triggerId: string } }) {
  const sb = supabaseServer();
  const owner_id = getOwner();
  const input = await req.json().catch(() => ({}));
  const { data: trigger } = await sb.from('triggers').select('*').eq('owner_id', owner_id).eq('id', params.triggerId).single();
  if (!trigger?.agent_id) return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });

  const runResponse = await fetch(`${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/api/agents/${trigger.agent_id}/run`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: { ...trigger.preset_params, ...input } })
  });
  const run = await runResponse.json();
  return NextResponse.json({ ok: true, run });
}
