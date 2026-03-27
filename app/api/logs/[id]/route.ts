export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseServer().from('runs').select('*, agents(name)').eq('owner_id', getOwner()).eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}
