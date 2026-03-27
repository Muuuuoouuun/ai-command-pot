export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

// Generates claude_desktop_config.json-compatible JSON for all active MCP servers.
// Only active stdio/http/sse servers that have the required fields are included.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'claude';  // 'claude' | 'env'

  const { data, error } = await supabaseServer()
    .from('mcp_servers')
    .select('*')
    .eq('owner_id', getOwner())
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const servers = data ?? [];

  if (format === 'env') {
    // Returns a .env snippet listing all required env var names across active servers
    const allVars = new Set<string>();
    for (const s of servers) {
      for (const v of (s.env_var_names ?? [])) allVars.add(v as string);
    }
    const lines = [...allVars].map(v => `${v}=`).join('\n');
    return new NextResponse(lines || '# No environment variables required', {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=".env.mcp"',
      },
    });
  }

  // Build claude_desktop_config.json mcpServers section
  const mcpServers: Record<string, unknown> = {};

  for (const s of servers) {
    const key = (s.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (s.transport === 'stdio') {
      if (!s.command) continue;
      mcpServers[key] = {
        command: s.command,
        args: s.args ?? [],
        ...(s.working_dir ? { cwd: s.working_dir } : {}),
        ...(Array.isArray(s.env_var_names) && s.env_var_names.length > 0
          ? {
              env: Object.fromEntries(
                (s.env_var_names as string[]).map((v: string) => [v, `\${${v}}`])
              ),
            }
          : {}),
      };
    } else {
      // http or sse
      if (!s.endpoint_url) continue;
      mcpServers[key] = {
        url: s.endpoint_url,
        transport: s.transport,
        ...((s.config as Record<string, unknown>) ?? {}),
      };
    }
  }

  const output = { mcpServers };

  return new NextResponse(JSON.stringify(output, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="claude_desktop_config.json"',
    },
  });
}
