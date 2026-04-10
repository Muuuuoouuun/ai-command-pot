import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { getDashboardConnection, getRuns } from '@/lib/data';
import { DataConnectionBadge } from '@/components/data-connection-badge';
import { OverviewStrip } from '@/components/overview-strip';
import { timeAgo, cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

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
  const filtered = status === 'all' ? runs : runs.filter(r => r.status === status);
  const failRate = runs.length ? Math.round((runs.filter(r => r.status === 'failed').length / runs.length) * 100) : 0;
  const successRate = runs.length ? 100 - failRate : 0;
  const usage: Record<string, number> = {};
  runs.forEach(r => { const key = r.agents?.name ?? 'Unknown'; usage[key] = (usage[key] ?? 0) + 1; });
  const mostUsed = Object.entries(usage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return (
    <div className="space-y-5">
      <SectionTitle title="Runs & Logs" subtitle="실패 원인과 실행 빈도를 빠르게 파악" />
      <DataConnectionBadge connected={connection.connected} note="run logging pipeline" />
      <OverviewStrip
        title="Run Health"
        items={[
          { label: 'Total', value: runs.length },
          { label: 'Success Rate', value: `${successRate}%` },
          { label: 'Fail Rate', value: `${failRate}%` },
          { label: 'Most Used', value: mostUsed },
        ]}
      />

      <div className="flex gap-2 text-xs flex-wrap">
        {(['all', 'success', 'failed', 'running'] as const).map(s => (
          <Link
            key={s}
            href={`/logs?status=${s}`}
            className={cn(
              'rounded-full border px-3 py-1 capitalize transition-colors',
              status === s ? 'bg-ink text-paper border-ink' : 'border-line hover:bg-ink/5'
            )}
          >
            {s}
            {s !== 'all' && (
              <span className="ml-1 opacity-60">({runs.filter(r => r.status === s).length})</span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-line rounded-2xl">
          <p className="text-ink/40 text-sm">실행 기록이 없습니다.</p>
          <Link href="/launch" className="mt-2 text-xs text-ink/30 hover:text-ink underline block">
            AI Launch에서 에이전트를 실행해 보세요
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(run => {
            const dur = run.duration_ms != null
              ? run.duration_ms < 1000 ? `${run.duration_ms}ms` : `${(run.duration_ms / 1000).toFixed(1)}s`
              : null;
            return (
              <Link
                key={run.id}
                href={`/logs/${run.id}`}
                className="paper-card flex items-center gap-3 p-4 hover:shadow-md transition-all"
              >
                {run.status === 'success'
                  ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  : run.status === 'failed'
                  ? <XCircle size={15} className="text-red-500 flex-shrink-0" />
                  : <Clock size={15} className="text-amber-400 flex-shrink-0 animate-pulse" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{run.agents?.name ?? 'Agent'}</p>
                  <p className="text-[10px] text-ink/30 font-mono">{run.id.slice(0, 8)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-ink/50">{timeAgo(run.started_at)}</p>
                  {dur && <p className="text-[10px] text-ink/30">{dur}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
