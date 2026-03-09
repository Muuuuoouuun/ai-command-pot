import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get('service');
  const tipType = searchParams.get('type');
  const featured = searchParams.get('featured');

  let query = supabaseServer()
    .from('tips')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (service) query = query.eq('service', service);
  if (tipType) query = query.eq('tip_type', tipType);
  if (featured === 'true') query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}
