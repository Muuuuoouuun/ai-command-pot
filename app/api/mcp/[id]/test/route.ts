export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';
import { McpHttpClient } from '@/lib/mcp-client';

/**
 * POST /api/mcp/[id]/test
 * Tests connectivity for an HTTP/SSE MCP server by calling tools/list.
 * Stdio servers cannot be tested from the server side.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { data: server } = await supabaseServer()
    .from('mcp_servers')
    .select('id, name, transport, endpoint_url')
    .eq('id', params.id)
    .eq('owner_id', getOwner())
    .single();

  if (!server) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (server.transport === 'stdio') {
    return NextResponse.json({
      ok: false,
      transport: 'stdio',
      message:
        'stdio 서버는 로컬 환경에서만 실행됩니다. claude_desktop_config.json을 내보내 Claude Desktop에서 직접 확인하세요.',
    });
  }

  if (!server.endpoint_url) {
    return NextResponse.json({ ok: false, message: 'endpoint_url이 설정되지 않았습니다.' });
  }

  try {
    const client = new McpHttpClient(server.endpoint_url as string);
    const tools = await client.listTools();
    return NextResponse.json({
      ok: true,
      message: `연결 성공 — ${tools.length}개 도구 확인`,
      tools: tools.map(t => t.name),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: `연결 실패: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
