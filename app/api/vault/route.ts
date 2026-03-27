export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { encryptSecret } from '@/lib/crypto';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const encrypted = encryptSecret(body.api_key);
  const payload = {
    owner_id: getOwner(),
    provider: body.provider,
    label: body.label,
    ...encrypted,
    monthly_budget_note: body.monthly_budget_note,
    alert_threshold_note: body.alert_threshold_note,
    rotated_at: new Date().toISOString()
  };
  const { data, error } = await supabaseServer().from('api_keys').insert(payload).select('id,provider,label,last4').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
