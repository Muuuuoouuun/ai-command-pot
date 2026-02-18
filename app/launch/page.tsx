'use client';

import { SectionTitle } from '@/components/section-title';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataConnectionBadge } from '@/components/data-connection-badge';

type Agent = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  runner_type: string;
  favorite?: boolean;
};

export default function LaunchPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState('');
  const [runnerFilter, setRunnerFilter] = useState('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [jsonInput, setJsonInput] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [inputError, setInputError] = useState('');
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetch('/api/triggers').then((r) => r.json()).then((d) => setAgents(d.agents ?? []));
    fetch('/api/health').then((r) => r.json()).then((d) => setConnected(Boolean(d?.connected))).catch(() => setConnected(false));
  }, []);

  const categories = Array.from(new Set(agents.map((a) => a.category).filter(Boolean))) as string[];
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => agents.filter((a) => {
    const hit = `${a.name} ${a.category ?? ''} ${a.runner_type}`.toLowerCase().includes(query.toLowerCase());
    const runnerHit = runnerFilter === 'all' || a.runner_type === runnerFilter;
    const categoryHit = category === 'all' || a.category === category;
    const favHit = !favoriteOnly || a.favorite;
    return hit && runnerHit && categoryHit && favHit;
  }), [agents, query, runnerFilter, category, favoriteOnly]);

  const runAgent = async () => {
    if (!selected) return;

    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(jsonInput || '{}');
      setInputError('');
    } catch {
      setInputError('Input must be valid JSON.');
      return;
    }

    setRunning(true);
    const response = await fetch(`/api/agents/${selected.id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: parsedInput })
    });
    setResult(await response.json());
    setRunning(false);
  };

  const saveAsNote = () => {
    const existing = JSON.parse(localStorage.getItem('aicn-result-notes') ?? '[]') as string[];
    const next = [`[${new Date().toLocaleString()}] ${selected?.name}: ${JSON.stringify(result?.output ?? result)}`, ...existing].slice(0, 30);
    localStorage.setItem('aicn-result-notes', JSON.stringify(next));
    alert('Saved to System Notes storage.');
  };

  return (
    <div className="space-y-4">
      <SectionTitle title="Quick Launch" subtitle="버튼 한 번으로 실행하고 결과를 바로 확인하세요." />
      <DataConnectionBadge connected={connected} note="agent + trigger pipeline" />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agent" className="w-full rounded-xl border border-line bg-white/70 p-3 text-sm" />
      <div className="flex flex-wrap gap-2 text-xs">
        {['all', 'llm_call', 'webhook', 'n8n'].map((f) => <button key={f} onClick={() => setRunnerFilter(f)} className={`rounded-full border px-3 py-1 ${runnerFilter === f ? 'bg-ink text-paper' : 'border-line'}`}>{f}</button>)}
        <button onClick={() => setFavoriteOnly((v) => !v)} className={`rounded-full border px-3 py-1 ${favoriteOnly ? 'bg-ink text-paper' : 'border-line'}`}>favorites</button>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-line bg-white/70 px-2 py-1">
          <option value="all">all categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <section className="space-y-3">
        {filtered.map((agent) => (
          <motion.div key={agent.id} whileHover={{ y: -2, rotate: 0.2 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="paper-card p-4">
            <p className="font-serif text-xl">{agent.name} {agent.favorite ? '★' : ''}</p>
            <p className="text-sm text-ink/70">{agent.description}</p>
            <div className="mt-3 flex items-center justify-between"><span className="text-xs text-ink/60">{agent.category} · {agent.runner_type}</span><button onClick={() => { setSelected(agent); setResult(null); setJsonInput('{}'); setInputError(''); }} className="rounded-lg bg-ink px-3 py-1 text-xs text-paper">Run</button></div>
          </motion.div>
        ))}
      </section>

      <AnimatePresence>
        {selected ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/35 p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} onClick={(e) => e.stopPropagation()} className="mx-auto mt-16 max-w-md rounded-2xl border border-line bg-paper p-4">
              <p className="font-serif text-xl">{selected.name}</p>
              <p className="mb-2 text-xs text-ink/65">Input JSON</p>
              <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="h-24 w-full rounded-xl border border-line bg-white/70 p-3 text-xs" />
              {inputError ? <p className="mt-2 text-xs text-red-700">{inputError}</p> : null}
              <button onClick={runAgent} disabled={running} className="mt-3 w-full rounded-xl bg-ink p-2 text-paper">{running ? 'Running…' : 'Run'}</button>
              {result ? (
                <div className="mt-3 space-y-2">
                  <pre className="max-h-44 overflow-auto rounded-xl border border-line bg-white/70 p-2 text-xs">{JSON.stringify(result.output ?? result, null, 2)}</pre>
                  <button onClick={saveAsNote} className="w-full rounded-xl border border-line px-3 py-2 text-xs">Save as Note</button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
