import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { getDashboardConnection, getRuns } from '@/lib/data';
import { DataConnectionBadge } from '@/components/data-connection-badge';
import { OverviewStrip } from '@/components/overview-strip';

type Run = {
  id: string;
  status: string;
  started_at: string;
  duration_ms?: number;
  agents?: { name: string };
};

export default async function LogsPage({ searchParams }: { searchParams?: { status?: string } }) {
  let runs: Run[] = [];
  try { runs = (await getRuns()) as unknown as Run[]; } catch { }
  const connection = await getDashboardConnection();

  const status = searchParams?.status ?? 'all';
  const filtered = status === 'all' ? runs : runs.filter((run) => run.status === status);
  const failRate = runs.length ? Math.round((runs.filter((r) => r.status === 'failed').length / runs.length) * 100) : 0;
  const successRate = runs.length ? 100 - failRate : 0;
  const usage: Record<string, number> = {};
  runs.forEach((r) => { const key = r.agents?.name ?? 'Unknown'; usage[key] = (usage[key] ?? 0) + 1; });
  const mostUsed = Object.entries(usage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return <div className="space-y-4"><SectionTitle title="Runs & Logs" subtitle="실패 원인과 실행 빈도를 빠르게 파악" /><DataConnectionBadge connected={connection.connected} note="run logging pipeline" /><OverviewStrip title="Run Health" items={[{ label: 'Total', value: runs.length }, { label: 'Success Rate', value: `${successRate}%` }, { label: 'Fail Rate', value: `${failRate}%` }, { label: 'Most Used', value: mostUsed }]} /><div className="flex gap-2 text-xs"><Link href="/logs?status=all" className={`rounded-full border px-3 py-1 ${status === 'all' ? 'bg-ink text-paper' : 'border-line'}`}>all</Link><Link href="/logs?status=success" className={`rounded-full border px-3 py-1 ${status === 'success' ? 'bg-ink text-paper' : 'border-line'}`}>success</Link><Link href="/logs?status=failed" className={`rounded-full border px-3 py-1 ${status === 'failed' ? 'bg-ink text-paper' : 'border-line'}`}>failed</Link></div><div className="space-y-3">{filtered.map((run) => <Link key={run.id} href={`/logs/${run.id}`} className="paper-card block p-4"><p className="font-serif">{run.agents?.name ?? 'Agent'}</p><p className="text-sm text-ink/70">{run.status} · {run.duration_ms ?? 0}ms · {new Date(run.started_at).toLocaleString()}</p></Link>)}</div></div>
}
