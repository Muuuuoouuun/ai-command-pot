import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';
import type { OrchestrationStep } from '@/lib/types';

export async function GET() {
  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const ownerId = getOwner();
  const { data, error } = await sb
    .from('orchestrations')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const ownerId = getOwner();
  const body = await req.json() as {
    name: string;
    description?: string;
    steps: OrchestrationStep[];
    execution_mode?: 'sequential' | 'parallel' | 'mixed';
  };

  if (!body.name || !body.steps?.length) {
    return NextResponse.json({ error: 'name and steps are required' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('orchestrations')
    .insert({
      owner_id: ownerId,
      name: body.name,
      description: body.description,
      steps: body.steps,
      execution_mode: body.execution_mode ?? 'sequential',
      is_active: true,
      total_runs: 0
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
