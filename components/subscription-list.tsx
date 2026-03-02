'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

type Subscription = {
  id: string;
  service_name: string;
  plan: string;
  renewal_date: string;
  monthly_cost: number;
  currency: string;
  status: 'active' | 'paused';
};

export function SubscriptionList({ subscriptions, sort }: { subscriptions: Subscription[]; sort: string }) {
  const sorted = [...subscriptions].sort((a, b) => {
    if (sort === 'cost') return Number(b.monthly_cost || 0) - Number(a.monthly_cost || 0);
    if (sort === 'az') return String(a.service_name).localeCompare(String(b.service_name));
    return new Date(a.renewal_date || 0).getTime() - new Date(b.renewal_date || 0).getTime();
  });

  const updateStatus = async (id: string, status: 'active' | 'paused') => {
    await fetch(`/api/subscriptions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    location.reload();
  };

  return (
    <div className="space-y-3">
      {sorted.map((s) => (
        <div key={s.id} className="paper-card space-y-2 p-4">
          <Link href={`/subscriptions/${s.id}`} className="block">
            <p className="font-serif text-xl">{s.service_name}</p>
            <p className="text-sm text-ink/70">{s.plan} · renews {formatDate(s.renewal_date)}</p>
            <p className="text-sm">{formatCurrency(Number(s.monthly_cost || 0), s.currency)}</p>
          </Link>
          <div className="flex gap-2 text-xs">
            <button onClick={() => updateStatus(s.id, 'active')} className={`rounded-full border px-3 py-1 ${s.status === 'active' ? 'bg-ink text-paper' : 'border-line'}`}>active</button>
            <button onClick={() => updateStatus(s.id, 'paused')} className={`rounded-full border px-3 py-1 ${s.status === 'paused' ? 'bg-ink text-paper' : 'border-line'}`}>paused</button>
          </div>
        </div>
      ))}
    </div>
  );
}
