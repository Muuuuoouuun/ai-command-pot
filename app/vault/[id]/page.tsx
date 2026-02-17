'use client';

import { SectionTitle } from '@/components/section-title';
import { useEffect, useState } from 'react';

export default function VaultDetail({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const load = () => fetch(`/api/vault/${params.id}`).then((r) => r.json()).then(setEntry);
  useEffect(() => { load(); }, [params.id]);

  const rotate = async () => {
    await fetch(`/api/vault/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: apiKey }) });
    setApiKey('');
    load();
  };

  const disable = async () => {
    await fetch(`/api/vault/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: false }) });
    load();
  };

  if (!entry) return null;
  return <div className="space-y-4"><SectionTitle title={`${entry.provider} key`} subtitle={entry.label} /><div className="paper-card space-y-2 p-4 text-sm"><p>Last4: ••••{entry.last4}</p><p>Status: {entry.is_active === false ? 'Disabled' : 'Active'}</p><p>Created: {new Date(entry.created_at).toLocaleString()}</p><p>Rotated: {entry.rotated_at ? new Date(entry.rotated_at).toLocaleString() : 'Never'}</p></div><div className="paper-card p-4 space-y-2"><input type="password" placeholder="New key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full rounded-xl border border-line p-3" /><button onClick={rotate} className="w-full rounded-xl bg-ink p-2 text-paper">Rotate key</button><button onClick={disable} className="w-full rounded-xl border border-line p-2">Disable</button></div></div>;
}
