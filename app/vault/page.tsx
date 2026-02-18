import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { getDashboardConnection, getVaultKeys } from '@/lib/data';
import { DataConnectionBadge } from '@/components/data-connection-badge';
import { OverviewStrip } from '@/components/overview-strip';

export default async function VaultPage() {
  let keys: any[] = [];
  try { keys = await getVaultKeys(); } catch {}
  const connection = await getDashboardConnection();

  const activeKeys = keys.filter((k) => k.is_active !== false).length;

  return (
    <div className="space-y-4">
      <SectionTitle title="API Key Vault" subtitle="중앙에서 API 키를 안전하게 관리하고 last4만 표시합니다." />
      <DataConnectionBadge connected={connection.connected} note="vault metadata only" />
      <OverviewStrip title="Vault Snapshot" items={[
        { label: 'Total Keys', value: keys.length },
        { label: 'Active', value: activeKeys },
        { label: 'Disabled', value: keys.length - activeKeys },
        { label: 'DB Rows', value: connection.counts.keys }
      ]} />
      <p className="text-xs text-ink/70">Keys are stored encrypted; never shown again.</p>
      <Link href="/vault/new" className="paper-card block p-3 text-center">+ New Provider Key</Link>
      <div className="space-y-3">{keys.map((k) => <Link key={k.id} href={`/vault/${k.id}`} className="paper-card block p-4"><p className="font-serif text-xl">{k.provider} · {k.label}</p><p className="text-sm text-ink/70">••••{k.last4} · {k.is_active === false ? 'Disabled' : 'Active'}</p></Link>)}</div>
    </div>
  );
}
