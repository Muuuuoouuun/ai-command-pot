export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ALLOWED = [
    'name', 'description', 'command', 'args', 'working_dir',
    'endpoint_url', 'env_var_names', 'vault_key_ids', 'capabilities',
    'config', 'is_active',
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ALLOWED) {
    const b = body as Record<string, unknown>;
    if (key in b) patch[key] = b[key];
  }

  const { data, error } = await supabaseServer()
    .from('mcp_servers')
    .update(patch)
    .eq('id', params.id)
    .eq('owner_id', getOwner())
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseServer()
    .from('mcp_servers')
    .delete()
    .eq('id', params.id)
    .eq('owner_id', getOwner());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
