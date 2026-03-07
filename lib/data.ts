import { supabaseServer } from './supabase';

const owner = process.env.DEMO_OWNER_ID || '00000000-0000-0000-0000-000000000001';

export async function getSubscriptions() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('subscriptions').select('*').eq('owner_id', owner).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAgents() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('agents').select('*').eq('owner_id', owner).order('favorite', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRuns(opts: { limit?: number; status?: string; agentId?: string; from?: string } = {}) {
  const sb = supabaseServer();
  let query = sb.from('runs').select('*, agents(id, name)').eq('owner_id', owner).order('started_at', { ascending: false });

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);
  if (opts.agentId) query = query.eq('agent_id', opts.agentId);
  if (opts.from) query = query.gte('started_at', opts.from);

  query = query.limit(opts.limit ?? 50);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getVaultKeys() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('api_keys').select('id, provider, label, last4, is_active, created_at, rotated_at, monthly_budget_note, alert_threshold_note').eq('owner_id', owner).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMemos(limit = 50) {
  const sb = supabaseServer();
  const { data, error } = await sb.from('memos').select('*').eq('owner_id', owner).order('created_at', { ascending: false }).limit(limit);
  if (error) {
    // If table doesn't exist yet (migration pending), return empty
    if (error.code === '42P01') return [];
    throw error;
  }
  return data ?? [];
}

export async function getAutomations() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('automations').select('*').eq('owner_id', owner).order('platform', { ascending: true });
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return data ?? [];
}

export async function getDashboardConnection() {
  try {
    const [subscriptions, agents, runs, keys, memos, automations] = await Promise.all([
      getSubscriptions(),
      getAgents(),
      getRuns({ limit: 1 }),
      getVaultKeys(),
      getMemos(),
      getAutomations()
    ]);

    return {
      connected: true,
      counts: {
        subscriptions: subscriptions.length,
        agents: agents.length,
        runs: runs.length,
        keys: keys.length,
        memos: memos.length,
        automations: automations.length
      },
      latestRunAt: runs[0]?.started_at ?? null
    };
  } catch {
    return {
      connected: false,
      counts: { subscriptions: 0, agents: 0, runs: 0, keys: 0, memos: 0, automations: 0 },
      latestRunAt: null
    };
  }
}

export async function getWeeklyStats() {
  const sb = supabaseServer();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  const [runsRes, memosRes, subsRes] = await Promise.allSettled([
    sb.from('runs').select('status, agent_id, agents(name)').eq('owner_id', owner).gte('started_at', weekAgoISO),
    sb.from('memos').select('id').eq('owner_id', owner).eq('is_processed', false),
    sb.from('subscriptions').select('monthly_cost').eq('owner_id', owner).eq('status', 'active')
  ]);

  const runs = runsRes.status === 'fulfilled' ? (runsRes.value.data ?? []) : [];
  const memos = memosRes.status === 'fulfilled' ? (memosRes.value.data ?? []) : [];
  const subs = subsRes.status === 'fulfilled' ? (subsRes.value.data ?? []) : [];

  const totalRuns = runs.length;
  const successRuns = runs.filter((r: any) => r.status === 'success').length;
  const healthPct = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;

  // Find top agent by run count
  const agentCounts: Record<string, { name: string; count: number }> = {};
  for (const run of runs as any[]) {
    if (run.agent_id) {
      const agentName = run.agents?.name ?? 'Unknown';
      if (!agentCounts[run.agent_id]) agentCounts[run.agent_id] = { name: agentName, count: 0 };
      agentCounts[run.agent_id].count++;
    }
  }
  const topAgent = Object.values(agentCounts).sort((a, b) => b.count - a.count)[0];

  const monthlyCost = (subs as any[]).reduce((sum, s) => sum + Number(s.monthly_cost ?? 0), 0);

  return {
    totalRuns,
    healthPct,
    topAgentName: topAgent?.name ?? null,
    pendingMemos: memos.length,
    monthlyCost
  };
}

export async function getDashboardAlerts() {
  const sb = supabaseServer();
  const since24h = new Date(Date.now() - 86400000).toISOString();
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString();

  const [failedRes, memosRes, renewalsRes] = await Promise.allSettled([
    sb.from('runs').select('id', { count: 'exact', head: true }).eq('owner_id', owner).eq('status', 'failed').gte('started_at', since24h),
    sb.from('memos').select('id', { count: 'exact', head: true }).eq('owner_id', owner).eq('is_processed', false),
    sb.from('subscriptions').select('id', { count: 'exact', head: true }).eq('owner_id', owner).lte('renewal_date', in7days).gte('renewal_date', new Date().toISOString()),
  ]);

  return {
    failedRuns24h: failedRes.status === 'fulfilled' ? (failedRes.value.count ?? 0) : 0,
    unprocessedMemos: memosRes.status === 'fulfilled' ? (memosRes.value.count ?? 0) : 0,
    renewingIn7Days: renewalsRes.status === 'fulfilled' ? (renewalsRes.value.count ?? 0) : 0,
  };
}

export const getOwner = () => owner;
