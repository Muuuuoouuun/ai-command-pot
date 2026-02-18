import { SectionTitle } from '@/components/section-title';
import { supabaseServer } from '@/lib/supabase';
import { getOwner } from '@/lib/data';
import { SubscriptionForm } from '../../subscription-form';

export default async function EditSubscriptionPage({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data } = await sb.from('subscriptions').select('*').eq('owner_id', getOwner()).eq('id', params.id).single();
  return <div className="space-y-4"><SectionTitle title="Edit Subscription" /><SubscriptionForm initial={data} /></div>;
}
