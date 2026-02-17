'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function SubscriptionForm({ initial }: { initial?: any }) {
  const [form, setForm] = useState(initial ?? { status: 'active', currency: 'USD', billing_cycle: 'monthly' });
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const method = initial ? 'PATCH' : 'POST';
    const url = initial ? `/api/subscriptions/${initial.id}` : '/api/subscriptions';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    router.push('/subscriptions');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="paper-card space-y-3 p-4 text-sm">
      {['service_name','plan','monthly_cost','currency','renewal_date','billing_cycle','account_email','tags','links','notes','tokens_used_month','cost_this_month'].map((field) => (
        <label key={field} className="block space-y-1"><span className="text-xs uppercase text-ink/60">{field.replaceAll('_', ' ')}</span><input className="w-full rounded-lg border border-line bg-white/70 p-2" value={form[field] ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, [field]: e.target.value }))} /></label>
      ))}
      <label className="block space-y-1"><span className="text-xs uppercase text-ink/60">status</span><select className="w-full rounded-lg border border-line bg-white/70 p-2" value={form.status} onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="paused">Paused</option></select></label>
      <button className="w-full rounded-xl bg-ink px-4 py-2 text-paper">Save</button>
    </form>
  );
}
