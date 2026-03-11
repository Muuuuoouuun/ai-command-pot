import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

type AgentRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  favorite: boolean;
  workspace_position: unknown;
  avatar_config: unknown;
  visual_status: string;
};

type ActivityRow = {
  agent_id: string;
  status: string;
  current_task: string | null;
  started_at: string;
};

export async function GET() {
  const owner = getOwner();
  const sb = supabaseServer();

  const { data: agents, error } = await sb
    .from('agents')
    .select('id, name, category, description, favorite, workspace_position, avatar_config, visual_status')
    .eq('owner_id', owner);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const agentIds = (agents ?? []).map((a: AgentRow) => a.id);
  const activities: Record<string, ActivityRow> = {};

  if (agentIds.length > 0) {
    const { data: acts } = await sb
      .from('agent_activities')
      .select('agent_id, status, current_task, started_at')
      .eq('owner_id', owner)
      .in('agent_id', agentIds)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      // One row per agent is enough — we keep only the first hit per agent_id
      .limit(agentIds.length);

    for (const act of (acts ?? []) as ActivityRow[]) {
      if (!activities[act.agent_id]) {
        activities[act.agent_id] = act;
      }
    }
  }

  const result = (agents ?? []).map((a: AgentRow) => ({
    ...a,
    status: activities[a.id]?.status ?? a.visual_status ?? 'offline',
    current_task: activities[a.id]?.current_task ?? null,
    last_activity: activities[a.id]?.started_at ?? null,
  }));

  return NextResponse.json({ data: result });
}
