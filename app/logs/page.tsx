import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { getDashboardConnection, getRuns, getAgents } from '@/lib/data';
import { DataConnectionBadge } from '@/components/data-connection-badge';
import { OverviewStrip } from '@/components/overview-strip';
import { LogsFilters } from './logs-filters';

export const dynamic = 'force-dynamic';

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: 'All', value: 'all' },
];

function getFromDate(range: string): string | undefined {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.toISOString();
  }
  if (range === '7d') {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (range === '30d') {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  return undefined;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams?: { status?: string; range?: string; agentId?: string };
}) {
  const status = searchParams?.status ?? 'all';
  const range = searchParams?.range ?? 'all';
  const agentId = searchParams?.agentId ?? '';

  let runs: any[] = [];
  let agents: any[] = [];
  try {
    runs = await getRuns({ status, agentId: agentId || undefined, from: getFromDate(range) });
  } catch {}
  try { agents = await getAgents(); } catch {}

  const connection = await getDashboardConnection();

  const totalRuns = runs.length;
  const failRate = totalRuns ? Math.round((runs.filter((r) => r.status === 'failed').length / totalRuns) * 100) : 0;
  const successRate = totalRuns ? 100 - failRate : 0;
  const usage: Record<string, number> = {};
  runs.forEach((r) => { const key = r.agents?.name ?? 'Unknown'; usage[key] = (usage[key] ?? 0) + 1; });
  const mostUsed = Object.entries(usage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return (
    <div className="space-y-4">
      <SectionTitle title="Runs & Logs" subtitle="실패 원인과 실행 빈도를 빠르게 파악" />
      <DataConnectionBadge connected={connection.connected} note="run logging pipeline" />
      <OverviewStrip
        title="Run Health"
        items={[
          { label: 'Total', value: totalRuns },
          { label: 'Success Rate', value: `${successRate}%` },
          { label: 'Fail Rate', value: `${failRate}%` },
          { label: 'Most Used', value: mostUsed },
        ]}
      />

      {/* Filters */}
      <div className="space-y-2">
        {/* Status filter */}
        <div className="flex gap-2 text-xs flex-wrap">
          {['all', 'success', 'failed'].map((s) => (
            <Link
              key={s}
              href={`/logs?status=${s}&range=${range}${agentId ? `&agentId=${agentId}` : ''}`}
              className={`rounded-full border px-3 py-1 transition-colors ${status === s ? 'bg-ink text-paper border-ink' : 'border-line hover:border-ink/40'}`}
            >
              {s}
            </Link>
          ))}
          <span className="border-l border-line mx-1" />
          {/* Date range filter */}
          {DATE_RANGES.map((dr) => (
            <Link
              key={dr.value}
              href={`/logs?status=${status}&range=${dr.value}${agentId ? `&agentId=${agentId}` : ''}`}
              className={`rounded-full border px-3 py-1 transition-colors ${range === dr.value ? 'bg-ink text-paper border-ink' : 'border-line hover:border-ink/40'}`}
            >
              {dr.label}
            </Link>
          ))}
        </div>

        {/* Agent dropdown (client component) */}
        <LogsFilters
          agents={agents}
          currentAgentId={agentId}
          currentStatus={status}
          currentRange={range}
        />
      </div>

      {/* Run list */}
      <div className="space-y-3">
        {runs.length === 0 ? (
          <div className="text-center py-12 text-ink/40 text-sm">No runs match these filters.</div>
        ) : (
          runs.map((run) => (
            <Link key={run.id} href={`/logs/${run.id}`} className="paper-card block p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif font-medium">{run.agents?.name ?? 'Agent'}</p>
                  <p className="text-sm text-ink/60 mt-0.5">
                    {new Date(run.started_at).toLocaleString()}
                    {run.duration_ms != null && ` · ${run.duration_ms}ms`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                  run.status === 'success'
                    ? 'bg-green-100 text-green-700'
                    : run.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {run.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
