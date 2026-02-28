import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  let sb;
  try { sb = supabaseServer(); } catch {
    return NextResponse.json({ agents: [], triggers: [] });
  }
  const { data: agents } = await sb.from('agents').select('*').eq('owner_id', getOwner()).order('favorite', { ascending: false });
  const { data: triggers } = await sb.from('triggers').select('*').eq('owner_id', getOwner());
  return NextResponse.json({ agents: agents ?? [], triggers: triggers ?? [] });
}
