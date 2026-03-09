import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  const owner = getOwner();
  const sb = supabaseServer();

  const { data: agents, error } = await sb
    .from('agents')
    .select('id, name, category, description, favorite, workspace_position, avatar_config, visual_status')
    .eq('owner_id', owner);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Fetch latest activity for each agent
  const agentIds = (agents ?? []).map((a: { id: string }) => a.id);
  const activities: Record<string, { status: string; current_task: string | null; started_at: string }> = {};

  if (agentIds.length > 0) {
    const { data: acts } = await sb
      .from('agent_activities')
      .select('agent_id, status, current_task, started_at')
      .eq('owner_id', owner)
      .in('agent_id', agentIds)
      .is('ended_at', null)
      .order('started_at', { ascending: false });

    // Keep only the latest per agent
    for (const act of acts ?? []) {
      if (!activities[act.agent_id]) {
        activities[act.agent_id] = act;
      }
    }
  }

  const result = (agents ?? []).map((a: { id: string; name: string; category: string; description: string; favorite: boolean; workspace_position: unknown; avatar_config: unknown; visual_status: string }) => ({
    ...a,
    status: activities[a.id]?.status ?? a.visual_status ?? 'offline',
    current_task: activities[a.id]?.current_task ?? null,
    last_activity: activities[a.id]?.started_at ?? null,
  }));

  return NextResponse.json({ data: result });
}
