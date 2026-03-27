export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  const sb = supabaseServer();
  const { data: agents } = await sb.from('agents').select('*').eq('owner_id', getOwner()).order('favorite', { ascending: false });
  const { data: triggers } = await sb.from('triggers').select('*').eq('owner_id', getOwner());
  return NextResponse.json({ agents: agents ?? [], triggers: triggers ?? [] });
}
