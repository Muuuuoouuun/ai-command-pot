import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? '30d';
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split('T')[0];

  const owner = getOwner();
  const sb = supabaseServer();

  const [eventsResult, dailyResult, budgetsResult] = await Promise.all([
    sb
      .from('ai_usage_events')
      .select('service, tokens_input, tokens_output, cost_usd, status, created_at')
      .eq('owner_id', owner)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false }),
    sb
      .from('ai_usage_daily')
      .select('*')
      .eq('owner_id', owner)
      .gte('date', sinceDate)
      .order('date', { ascending: true }),
    sb.from('ai_service_budgets').select('*').eq('owner_id', owner),
  ]);

  const events = eventsResult.data ?? [];
  const daily = dailyResult.data ?? [];
  const budgets = budgetsResult.data ?? [];

  // Aggregate by service
  const byService: Record<string, { calls: number; cost: number; tokens: number; errors: number }> = {};
  for (const e of events) {
    if (!byService[e.service]) byService[e.service] = { calls: 0, cost: 0, tokens: 0, errors: 0 };
    byService[e.service].calls++;
    byService[e.service].cost += Number(e.cost_usd ?? 0);
    byService[e.service].tokens += (e.tokens_input ?? 0) + (e.tokens_output ?? 0);
    if (e.status === 'error' || e.status === 'rate_limited') byService[e.service].errors++;
  }

  const totalCost = events.reduce((s, e) => s + Number(e.cost_usd ?? 0), 0);
  const totalCalls = events.length;
  const totalTokens = events.reduce((s, e) => s + (e.tokens_input ?? 0) + (e.tokens_output ?? 0), 0);
  const errorCount = events.filter(e => e.status === 'error' || e.status === 'rate_limited').length;

  return NextResponse.json({
    summary: { totalCost, totalCalls, totalTokens, errorCount, period: `${days}d` },
    byService,
    daily,
    budgets,
  });
}
