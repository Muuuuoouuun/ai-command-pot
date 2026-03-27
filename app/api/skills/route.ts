export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const service = searchParams.get('service');
  const search = searchParams.get('q');
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 12;

  let query = supabaseServer()
    .from('skills')
    .select('id, title, slug, category, tags, difficulty, related_service, view_count, created_at')
    .eq('is_published', true)
    .order('view_count', { ascending: false });

  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (service) query = query.eq('related_service', service);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}
