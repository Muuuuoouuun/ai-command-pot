import Link from 'next/link';
import { MotionCard } from '@/components/motion-card';
import { SectionTitle } from '@/components/section-title';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAgents, getDashboardConnection, getRuns, getSubscriptions } from '@/lib/data';
import { SystemNotes } from '@/components/system-notes';
import { DataConnectionBadge } from '@/components/data-connection-badge';
import { OverviewStrip } from '@/components/overview-strip';

type Subscription = {
  id: string;
  service_name: string;
  renewal_date: string;
  monthly_cost: number;
  currency: string;
};

type Run = {
  id: string;
  started_at: string;
  status: string;
  duration_ms: number;
  agents?: { name: string };
};

type Agent = {
  id: string;
  name: string;
  favorite: boolean;
};

export default async function HomePage({ searchParams }: { searchParams?: { days?: string } }) {
  let subscriptions: Subscription[] = [];
  let runs: Run[] = [];
  let agents: Agent[] = [];
  try { subscriptions = (await getSubscriptions()) as unknown as Subscription[]; runs = (await getRuns(5)) as unknown as Run[]; agents = (await getAgents()) as unknown as Agent[]; } catch { }
  const connection = await getDashboardConnection();

  const days = searchParams?.days === '7' ? 7 : 14;
  const total = subscriptions.reduce((sum, item) => sum + Number(item.monthly_cost ?? 0), 0);
  const renewals = subscriptions
    .filter((item) => item.renewal_date)
    .map((item) => ({ ...item, daysLeft: Math.ceil((new Date(item.renewal_date).getTime() - Date.now()) / 86400000) }))
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const runsToday = runs.filter((run) => new Date(run.started_at).toDateString() === new Date().toDateString()).length;
  const favs = agents.filter((a) => a.favorite).slice(0, 5);

  return (
    <div className="space-y-5">
      <SectionTitle title="AI Control Notebook" subtitle="내 시스템 건강상태를 한 눈에 보는 모바일 컨트롤 타워" />
      <DataConnectionBadge connected={connection.connected} note={connection.connected ? 'Supabase sync ready' : 'Check env + DB'} />
      <OverviewStrip
        title="Control Snapshot"
        items={[
          { label: 'Subscriptions', value: connection.counts.subscriptions, href: '/subscriptions' },
          { label: 'Agents', value: connection.counts.agents, href: '/launch' },
          { label: 'Vault Keys', value: connection.counts.keys, href: '/vault' },
          { label: 'Latest Run', value: connection.latestRunAt ? formatDate(connection.latestRunAt) : '—', href: '/logs' }
        ]}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[['Monthly Spend', formatCurrency(total)], ['Renewals Soon', renewals.length], ['Runs Today', runsToday]].map(([label, value]) => (
          <MotionCard key={String(label)}><div className="p-4"><p className="text-xs text-ink/60">{label}</p><p className="mt-2 font-serif text-2xl">{value}</p></div></MotionCard>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Renewals Timeline</h2>
          <div className="flex gap-2 text-xs">
            <Link href="/?days=7" className={`rounded-full border px-3 py-1 ${days === 7 ? 'bg-ink text-paper' : 'border-line'}`}>D-7</Link>
            <Link href="/?days=14" className={`rounded-full border px-3 py-1 ${days === 14 ? 'bg-ink text-paper' : 'border-line'}`}>D-14</Link>
          </div>
        </div>
        {renewals.map((s) => (
          <div key={s.id} className="paper-card flex items-center justify-between p-3 text-sm">
            <div><p>{s.service_name}</p><p className="text-xs text-ink/60">{formatDate(s.renewal_date)}</p></div>
            <p>{formatCurrency(Number(s.monthly_cost || 0), s.currency)}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">Favorite Launch</h2>
        <div className="grid grid-cols-2 gap-3">{favs.map((agent) => <Link key={agent.id} href="/launch" className="paper-card p-3 text-sm">{agent.name}</Link>)}</div>
      </section>

      <SystemNotes />

      <section className="space-y-2">
        <h2 className="font-serif text-xl">Recent Activity</h2>
        {runs.map((run) => (
          <Link key={run.id} href={`/logs/${run.id}`} className="paper-card flex items-center justify-between p-3 text-sm">
            <p>{run.agents?.name ?? 'Agent'}</p>
            <p><span className={`rounded-full px-2 py-0.5 text-xs ${run.status === 'success' ? 'bg-green-100' : run.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'}`}>{run.status}</span> · {run.duration_ms ?? 0}ms</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
