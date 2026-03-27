export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

const tables = ['subscriptions', 'agents', 'triggers', 'runs', 'api_keys'] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'json';

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 503 });
  }

  const owner = getOwner();
  const payload: Record<string, unknown> = {};

  for (const table of tables) {
    const { data, error } = await sb.from(table).select('*').eq('owner_id', owner);
    if (error) return NextResponse.json({ error: error.message, table }, { status: 400 });
    payload[table] = data ?? [];
  }

  if (format === 'csv') {
    const rows = [
      ['table', 'count'],
      ...tables.map((table) => [table, String((payload[table] as unknown[]).length)])
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="aicn-export.csv"'
      }
    });
  }

  return NextResponse.json(payload, {
    headers: { 'Content-Disposition': 'attachment; filename="aicn-export.json"' }
  });
}
