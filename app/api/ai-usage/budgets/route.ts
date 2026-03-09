import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseServer()
    .from('ai_service_budgets')
    .select('*')
    .eq('owner_id', getOwner());
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const payload = { ...body, owner_id: getOwner() };
  const { data, error } = await supabaseServer()
    .from('ai_service_budgets')
    .upsert(payload, { onConflict: 'service,budget_type,owner_id' })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
