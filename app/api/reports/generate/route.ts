import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { type, period_start } = body as { type: 'weekly' | 'monthly'; period_start: string };

  const owner = getOwner();
  const sb = supabaseServer();

  const start = new Date(period_start);
  const end = new Date(period_start);
  if (type === 'weekly') {
    end.setDate(end.getDate() + 6);
  } else {
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);
  }

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  // Gather data from the feature tables
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

  // Aggregate AI usage by service
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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
