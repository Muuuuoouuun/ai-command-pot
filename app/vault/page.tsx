import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { getVaultKeys } from '@/lib/data';

export default async function VaultPage() {
  let keys: any[] = [];
  try { keys = await getVaultKeys(); } catch {}

  return <div className="space-y-4"><SectionTitle title="API Key Vault" subtitle="중앙에서 API 키를 안전하게 관리하고 last4만 표시합니다." /><p className="text-xs text-ink/70">Keys are stored encrypted; never shown again.</p><Link href="/vault/new" className="paper-card block p-3 text-center">+ New Provider Key</Link><div className="space-y-3">{keys.map((k) => <Link key={k.id} href={`/vault/${k.id}`} className="paper-card block p-4"><p className="font-serif text-xl">{k.provider} · {k.label}</p><p className="text-sm text-ink/70">••••{k.last4} · {k.is_active === false ? 'Disabled' : 'Active'}</p></Link>)}</div></div>
}
