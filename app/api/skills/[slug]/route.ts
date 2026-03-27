export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from('skills')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Increment view count (fire-and-forget)
  sb.from('skills').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id).then(() => {});

  return NextResponse.json(data);
}
