import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { getDashboardConnection, getSubscriptions } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { SubscriptionList } from '@/components/subscription-list';
import { DataConnectionBadge } from '@/components/data-connection-badge';
import { OverviewStrip } from '@/components/overview-strip';

type Subscription = {
  id: string;
  service_name: string;
  renewal_date: string;
  monthly_cost: number;
  currency: string;
  status: 'active' | 'paused';
  plan: string;
};

export default async function SubscriptionsPage({ searchParams }: { searchParams?: { sort?: string } }) {
  let subscriptions: Subscription[] = [];
  try { subscriptions = (await getSubscriptions()) as unknown as Subscription[]; } catch { }
  const connection = await getDashboardConnection();

  const active = subscriptions.filter((s) => s.status === 'active').length;
  const paused = subscriptions.filter((s) => s.status === 'paused').length;
  const total = subscriptions.reduce((sum, s) => sum + Number(s.monthly_cost || 0), 0);
  const sort = searchParams?.sort ?? 'renewal';

  return (
    <div className="space-y-4">
      <SectionTitle title="Subscriptions" subtitle="비용, 갱신, 중복 구독을 한 눈에 관리" />
      <DataConnectionBadge connected={connection.connected} note="billing + renewal sync" />
      <OverviewStrip title="Spend Overview" items={[
        { label: 'Total Monthly', value: formatCurrency(total) },
        { label: 'Active', value: active },
        { label: 'Paused', value: paused },
        { label: 'Rows Synced', value: connection.counts.subscriptions }
      ]} />
      <div className="flex gap-2 text-xs">
        <Link href="/subscriptions?sort=renewal" className={`rounded-full border px-3 py-1 ${sort === 'renewal' ? 'bg-ink text-paper' : 'border-line'}`}>Renewal soon</Link>
        <Link href="/subscriptions?sort=cost" className={`rounded-full border px-3 py-1 ${sort === 'cost' ? 'bg-ink text-paper' : 'border-line'}`}>Cost high</Link>
        <Link href="/subscriptions?sort=az" className={`rounded-full border px-3 py-1 ${sort === 'az' ? 'bg-ink text-paper' : 'border-line'}`}>A-Z</Link>
      </div>
      <Link href="/subscriptions/new" className="paper-card block p-3 text-center text-sm">+ New Subscription</Link>
      <SubscriptionList subscriptions={subscriptions} sort={sort} />
    </div>
  )
}
