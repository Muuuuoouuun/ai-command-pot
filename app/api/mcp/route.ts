export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

const VALID_TYPES = [
  'notion', 'figma', 'github', 'slack', 'linear', 'jira',
  'google-drive', 'custom-stdio', 'custom-http', 'custom-sse',
] as const;
const VALID_TRANSPORTS = ['stdio', 'http', 'sse'] as const;

export async function GET() {
  const { data, error } = await supabaseServer()
    .from('mcp_servers')
    .select('*')
    .eq('owner_id', getOwner())
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!b.server_type || !VALID_TYPES.includes(b.server_type as typeof VALID_TYPES[number])) {
    return NextResponse.json({ error: `server_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  const transport = (b.transport ?? 'stdio') as string;
  if (!VALID_TRANSPORTS.includes(transport as typeof VALID_TRANSPORTS[number])) {
    return NextResponse.json({ error: `transport must be one of: ${VALID_TRANSPORTS.join(', ')}` }, { status: 400 });
  }

  // Transport-specific validation
  if (transport === 'stdio' && typeof b.command !== 'string') {
    return NextResponse.json({ error: 'command is required for stdio transport' }, { status: 400 });
  }
  if ((transport === 'http' || transport === 'sse') && typeof b.endpoint_url !== 'string') {
    return NextResponse.json({ error: 'endpoint_url is required for http/sse transport' }, { status: 400 });
  }

  const payload = {
    name: (b.name as string).trim(),
    description: typeof b.description === 'string' ? b.description.trim() : null,
    server_type: b.server_type,
    transport,
    command: typeof b.command === 'string' ? b.command.trim() : null,
    args: Array.isArray(b.args) ? b.args : [],
    working_dir: typeof b.working_dir === 'string' ? b.working_dir.trim() : null,
    endpoint_url: typeof b.endpoint_url === 'string' ? b.endpoint_url.trim() : null,
    env_var_names: Array.isArray(b.env_var_names) ? b.env_var_names : [],
    vault_key_ids: Array.isArray(b.vault_key_ids) ? b.vault_key_ids : [],
    capabilities: Array.isArray(b.capabilities) ? b.capabilities : [],
    config: typeof b.config === 'object' && b.config !== null ? b.config : {},
    is_active: b.is_active !== false,
    owner_id: getOwner(),
  };

  const { data, error } = await supabaseServer()
    .from('mcp_servers')
    .insert(payload)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
