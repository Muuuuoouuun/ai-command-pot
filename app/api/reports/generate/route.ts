import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

const VALID_TYPES = ['weekly', 'monthly'] as const;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, period_start } = body as Record<string, unknown>;

  if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  if (typeof period_start !== 'string' || isNaN(new Date(period_start).getTime())) {
    return NextResponse.json(
      { error: 'period_start must be a valid ISO date string (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const owner = getOwner();
  const sb = supabaseServer();

  const start = new Date(period_start as string);
  const end = new Date(period_start as string);
  if (type === 'weekly') {
    end.setDate(end.getDate() + 6);
  } else {
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);
  }

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const [usageResult, automationsResult] = await Promise.all([
    sb
      .from('ai_usage_daily')
      .select('service, total_calls, total_cost_usd, total_tokens_input, total_tokens_output, error_count')
      .eq('owner_id', owner)
      .gte('date', startStr)
      .lte('date', endStr),
    sb
      .from('automation_executions')
      .select('status')
      .eq('owner_id', owner)
      .gte('triggered_at', start.toISOString())
      .lte('triggered_at', end.toISOString()),
  ]);

  const usageData = usageResult.data ?? [];
  const automationData = automationsResult.data ?? [];

  const serviceBreakdown: Record<string, { calls: number; cost: number }> = {};
  let totalCost = 0;
  let totalAICalls = 0;
  for (const row of usageData) {
    if (!serviceBreakdown[row.service]) serviceBreakdown[row.service] = { calls: 0, cost: 0 };
    serviceBreakdown[row.service].calls += row.total_calls;
    serviceBreakdown[row.service].cost += Number(row.total_cost_usd ?? 0);
    totalCost += Number(row.total_cost_usd ?? 0);
    totalAICalls += row.total_calls;
  }

  const totalAutomations = automationData.length;
  const successCount = automationData.filter((a: { status: string }) => a.status === 'success').length;
  const successRate = totalAutomations > 0 ? Math.round((successCount / totalAutomations) * 100) : 100;

  const reportData = {
    summary: { totalCost, totalAICalls, totalAutomations, successRate },
    serviceBreakdown: Object.entries(serviceBreakdown).map(([service, s]) => ({ service, ...s })),
    automationBreakdown: [],
    anomalies: [],
  };

  const { data, error } = await sb
    .from('usage_reports')
    .upsert(
      {
        owner_id: owner,
        report_type: type,
        period_start: startStr,
        period_end: endStr,
        report_data: reportData,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'report_type,period_start,owner_id' }
    )
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
