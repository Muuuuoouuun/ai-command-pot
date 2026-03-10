import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

const VALID_BUDGET_TYPES = ['daily', 'monthly'] as const;

export async function GET() {
  const { data, error } = await supabaseServer()
    .from('ai_service_budgets')
    .select('*')
    .eq('owner_id', getOwner());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { service, budget_type, budget_usd, token_limit } =
    body as Record<string, unknown>;

  if (typeof service !== 'string' || !service.trim()) {
    return NextResponse.json({ error: 'service is required' }, { status: 400 });
  }
  if (!budget_type || !VALID_BUDGET_TYPES.includes(budget_type as typeof VALID_BUDGET_TYPES[number])) {
    return NextResponse.json(
      { error: `budget_type must be one of: ${VALID_BUDGET_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  if (budget_usd === undefined && token_limit === undefined) {
    return NextResponse.json(
      { error: 'At least one of budget_usd or token_limit is required' },
      { status: 400 }
    );
  }

  const payload = {
    service: (service as string).trim().toLowerCase(),
    budget_type,
    budget_usd: typeof budget_usd === 'number' ? budget_usd : null,
    token_limit: typeof token_limit === 'number' ? token_limit : null,
    alert_threshold_percent:
      typeof (body as Record<string, unknown>).alert_threshold_percent === 'number'
        ? (body as Record<string, unknown>).alert_threshold_percent
        : 80,
    owner_id: getOwner(),
  };

  const { data, error } = await supabaseServer()
    .from('ai_service_budgets')
    .upsert(payload, { onConflict: 'service,budget_type,owner_id' })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
