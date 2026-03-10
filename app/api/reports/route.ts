import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseServer()
    .from('usage_reports')
    .select('id, report_type, period_start, period_end, generated_at')
    .eq('owner_id', getOwner())
    .order('generated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
