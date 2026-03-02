'use client';

import { SectionTitle } from '@/components/section-title';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VaultNew() {
  const [form, setForm] = useState({ provider: 'openai', label: '', api_key: '', monthly_budget_note: '', alert_threshold_note: '' });
  const router = useRouter();
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    router.push('/vault');
  };
  return <div className="space-y-4"><SectionTitle title="New Vault Entry" /><form onSubmit={onSubmit} className="paper-card space-y-3 p-4">{Object.keys(form).map((k) => <input key={k} type={k === 'api_key' ? 'password' : 'text'} value={(form as Record<string, string>)[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={k} className="w-full rounded-xl border border-line bg-white/70 p-3 text-sm" />)}<button className="w-full rounded-xl bg-ink p-2 text-paper">Encrypt & Save</button></form></div>
}
