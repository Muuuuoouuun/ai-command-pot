import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseServer().from('subscriptions').select('*').eq('owner_id', getOwner()).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const payload = { ...body, owner_id: getOwner(), tags: typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()) : body.tags };
  const { data, error } = await supabaseServer().from('subscriptions').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
