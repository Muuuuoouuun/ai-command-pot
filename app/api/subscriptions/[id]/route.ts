import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const payload = { ...body, tags: typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()) : body.tags };
  const { data, error } = await supabaseServer().from('subscriptions').update(payload).eq('owner_id', getOwner()).eq('id', params.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseServer().from('subscriptions').delete().eq('owner_id', getOwner()).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
