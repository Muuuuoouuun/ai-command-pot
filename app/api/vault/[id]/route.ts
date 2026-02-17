import { NextResponse } from 'next/server';
import { encryptSecret } from '@/lib/crypto';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseServer().from('api_keys').select('id,provider,label,last4,created_at,rotated_at,monthly_budget_note,alert_threshold_note,is_active').eq('owner_id', getOwner()).eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.api_key) Object.assign(update, encryptSecret(body.api_key), { rotated_at: new Date().toISOString(), is_active: true });
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  const { data, error } = await supabaseServer().from('api_keys').update(update).eq('owner_id', getOwner()).eq('id', params.id).select('id,last4,rotated_at,is_active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
