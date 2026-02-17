import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { supabaseServer } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getOwner } from '@/lib/data';

export default async function SubscriptionDetail({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data } = await sb.from('subscriptions').select('*').eq('owner_id', getOwner()).eq('id', params.id).single();
  if (!data) return <p>Not found.</p>;

  return <div className="space-y-4"><SectionTitle title={data.service_name} subtitle={data.notes} /><div className="paper-card p-4 text-sm space-y-2"><p>Plan: {data.plan}</p><p>Cost: {formatCurrency(data.monthly_cost, data.currency)}</p><p>Renewal: {formatDate(data.renewal_date)}</p><p>Status: {data.status}</p><p>Tags: {(data.tags || []).join(', ')}</p></div><Link href={`/subscriptions/${data.id}/edit`} className="paper-card block p-3 text-center">Edit</Link></div>;
}
