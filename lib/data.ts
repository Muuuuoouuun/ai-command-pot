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

export async function getRuns(limit = 25) {
  const sb = supabaseServer();
  const { data, error } = await sb.from('runs').select('*, agents(name)').eq('owner_id', owner).order('started_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getVaultKeys() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('api_keys').select('id, provider, label, last4, is_active, created_at, rotated_at, monthly_budget_note, alert_threshold_note').eq('owner_id', owner).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDashboardConnection() {
  try {
    const [subscriptions, agents, runs, keys] = await Promise.all([
      getSubscriptions(),
      getAgents(),
      getRuns(1),
      getVaultKeys()
    ]);

    return {
      connected: true,
      counts: {
        subscriptions: subscriptions.length,
        agents: agents.length,
        runs: runs.length,
        keys: keys.length
      },
      latestRunAt: runs[0]?.started_at ?? null
    };
  } catch {
    return {
      connected: false,
      counts: { subscriptions: 0, agents: 0, runs: 0, keys: 0 },
      latestRunAt: null
    };
  }
}

export const getOwner = () => owner;
