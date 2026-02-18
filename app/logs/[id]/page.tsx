'use client';

import { SectionTitle } from '@/components/section-title';
import { useEffect, useState } from 'react';

export default function LogDetail({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<any>(null);
  useEffect(() => { fetch(`/api/logs/${params.id}`).then((r) => r.json()).then(setRun); }, [params.id]);
  if (!run) return null;

  const copy = async (value: unknown) => navigator.clipboard.writeText(JSON.stringify(value, null, 2));

  return <div className="space-y-4"><SectionTitle title={`Run ${run.status}`} subtitle={run.agents?.name} /><div className="paper-card space-y-3 p-4 text-xs"><div className="flex items-center justify-between"><p>Input</p><button onClick={() => copy(run.input)} className="rounded border border-line px-2 py-1">Copy</button></div><pre className="overflow-auto rounded border border-line bg-white/60 p-2">{JSON.stringify(run.input, null, 2)}</pre><div className="flex items-center justify-between"><p>Output</p><button onClick={() => copy(run.output)} className="rounded border border-line px-2 py-1">Copy</button></div><pre className="overflow-auto rounded border border-line bg-white/60 p-2">{JSON.stringify(run.output, null, 2)}</pre>{run.error ? <><p className="font-medium text-red-700">Error</p><pre className="overflow-auto rounded border border-red-200 bg-red-50 p-2 text-red-700">{run.error}</pre></> : null}</div></div>;
}
