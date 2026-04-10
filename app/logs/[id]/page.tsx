'use client';

import { SectionTitle } from '@/components/section-title';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Clock, DollarSign, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Run = {
  id: string;
  status: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  cost_estimate?: number;
  agents?: { name: string };
  input?: unknown;
  output?: unknown;
  error?: string | null;
};

function CopyButton({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} title="Copy" className="p-1 rounded hover:bg-ink/10 text-ink/40 transition-colors">
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
    </button>
  );
}

function JsonBlock({ label, value, isError = false }: { label: string; value: unknown; isError?: boolean }) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn('text-xs font-semibold uppercase tracking-wider', isError ? 'text-red-600' : 'text-ink/40')}>
          {label}
        </span>
        <CopyButton value={value} />
      </div>
      <pre className={cn(
        'text-[11px] rounded-xl p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all',
        isError
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-ink/5 text-ink/70'
      )}>
        {text}
      </pre>
    </div>
  );
}

export default function LogDetail({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/logs/${params.id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setRun(data); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-ink/10 rounded w-48" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-7 bg-ink/10 rounded-full w-24" />)}
        </div>
        <div className="paper-card p-5 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-ink/10 rounded" style={{ width: `${50 + i * 15}%` }} />)}
        </div>
      </div>
    );
  }

  if (notFound || !run) {
    return (
      <div className="text-center py-20">
        <p className="text-ink/40 text-sm">실행 기록을 찾을 수 없습니다.</p>
        <Link href="/logs" className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink underline">
          <ArrowLeft size={14} /> 목록으로
        </Link>
      </div>
    );
  }

  const duration = run.duration_ms != null
    ? run.duration_ms < 1000 ? `${run.duration_ms}ms` : `${(run.duration_ms / 1000).toFixed(1)}s`
    : null;

  const statusClass = run.status === 'success'
    ? 'bg-green-50 text-green-700'
    : run.status === 'failed'
    ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-700';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/logs" className="p-1.5 rounded-lg hover:bg-ink/5 text-ink/40 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <SectionTitle title={run.agents?.name ?? 'Agent Run'} subtitle={`Run ${run.id.slice(0, 8)}`} />
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium', statusClass)}>
          {run.status === 'success' ? <CheckCircle2 size={12} /> : run.status === 'failed' ? <XCircle size={12} /> : <Loader2 size={12} className="animate-spin" />}
          {run.status}
        </div>
        {duration && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-ink/5 text-ink/60">
            <Clock size={11} /> {duration}
          </div>
        )}
        {run.cost_estimate != null && run.cost_estimate > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-ink/5 text-ink/60">
            <DollarSign size={11} /> ${run.cost_estimate.toFixed(6)}
          </div>
        )}
        {run.started_at && (
          <span className="text-xs text-ink/30">
            {new Date(run.started_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* Payload */}
      <div className="paper-card p-5 space-y-5">
        {run.input !== undefined && <JsonBlock label="Input" value={run.input} />}
        {run.output !== undefined && <JsonBlock label="Output" value={run.output} />}
        {run.error && <JsonBlock label="Error" value={run.error} isError />}
        {!run.input && !run.output && !run.error && (
          <p className="text-xs text-ink/40 text-center py-4">페이로드 없음</p>
        )}
      </div>
    </div>
  );
}
