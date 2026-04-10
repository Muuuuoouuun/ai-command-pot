import Link from 'next/link';
import { MotionCard } from '@/components/motion-card';
import { SectionTitle } from '@/components/section-title';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
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
          { label: 'Latest Run', value: connection.latestRunAt ? timeAgo(connection.latestRunAt) : '—', href: '/logs' }
        ]}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Monthly Spend', value: formatCurrency(total), href: '/subscriptions' },
          { label: 'Renewals Soon', value: String(renewals.length), href: `/?days=${days}` },
          { label: 'Runs Today', value: String(runsToday), href: '/logs' },
        ].map(({ label, value, href }) => (
          <Link key={label} href={href}>
            <MotionCard><div className="p-4"><p className="text-xs text-ink/60">{label}</p><p className="mt-2 font-serif text-2xl">{value}</p></div></MotionCard>
          </Link>
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
        {renewals.length === 0 ? (
          <p className="text-sm text-ink/40 py-3 pl-1">이 기간에 만료 예정인 구독이 없습니다.</p>
        ) : renewals.map(s => (
          <Link key={s.id} href={`/subscriptions/${s.id}`} className="paper-card flex items-center justify-between p-3 text-sm hover:shadow-sm transition-all">
            <div><p>{s.service_name}</p><p className="text-xs text-ink/60">{formatDate(s.renewal_date)} · D-{s.daysLeft}</p></div>
            <p>{formatCurrency(Number(s.monthly_cost || 0), s.currency)}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">Favorite Launch</h2>
        {favs.length === 0 ? (
          <Link href="/launch" className="paper-card p-4 text-sm text-center text-ink/40 border-dashed block hover:bg-ink/5 transition-colors">
            즐겨찾기 에이전트 없음 → AI Launch에서 ★ 표시하세요
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favs.map(agent => <Link key={agent.id} href="/launch" className="paper-card p-3 text-sm hover:shadow-sm transition-all">{agent.name}</Link>)}
          </div>
        )}
      </section>

      <SystemNotes />

      <section className="space-y-2">
        <h2 className="font-serif text-xl">Recent Activity</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-ink/40 py-3 pl-1">최근 실행 기록이 없습니다.</p>
        ) : runs.map(run => (
          <Link key={run.id} href={`/logs/${run.id}`} className="paper-card flex items-center justify-between p-3 text-sm hover:shadow-sm transition-all">
            <p>{run.agents?.name ?? 'Agent'}</p>
            <p>
              <span className={`rounded-full px-2 py-0.5 text-xs mr-2 ${run.status === 'success' ? 'bg-green-100 text-green-700' : run.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{run.status}</span>
              <span className="text-ink/40 text-xs">{timeAgo(run.started_at)}</span>
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
