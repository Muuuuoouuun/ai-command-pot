'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, ChevronRight, CheckCircle, XCircle, Clock, Loader2, GitBranch, Zap, Bot, Globe } from 'lucide-react';
import type { Orchestration, OrchestrationStep } from '@/lib/types';

type RunState = {
  runId: string | null;
  status: 'idle' | 'running' | 'success' | 'failed';
  stepsState: Record<string, { status: string; output?: unknown; error?: string; duration_ms?: number }>;
  finalOutput?: unknown;
  error?: string;
};

const RUNNER_ICONS = {
  claude: Bot,
  agent: Bot,
  webhook: Globe,
  condition: GitBranch
};

const RUNNER_COLORS = {
  claude: 'bg-purple-100 text-purple-700',
  agent: 'bg-blue-100 text-blue-700',
  webhook: 'bg-green-100 text-green-700',
  condition: 'bg-yellow-100 text-yellow-700'
};

const STEP_STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-ink/40', label: 'Pending' },
  running: { icon: Loader2, color: 'text-blue-600 animate-spin', label: 'Running' },
  success: { icon: CheckCircle, color: 'text-green-600', label: 'Done' },
  failed: { icon: XCircle, color: 'text-red-600', label: 'Failed' },
  skipped: { icon: Clock, color: 'text-ink/30', label: 'Skipped' }
};

const DEMO_TEMPLATE: Omit<Orchestration, 'id' | 'owner_id' | 'created_at'> = {
  name: 'Research & Summarize Pipeline',
  description: 'Fetch data, analyze with Claude, then save as memo',
  execution_mode: 'sequential',
  is_active: true,
  total_runs: 0,
  steps: [
    {
      id: 'step-1',
      name: 'Fetch Data',
      description: 'Retrieve data from webhook/API',
      runner_type: 'webhook',
      config: { webhook_url: 'https://httpbin.org/post', task_description: 'Fetch source data' },
      order_index: 0
    },
    {
      id: 'step-2',
      name: 'Analyze with Claude',
      description: 'Use Claude AI to analyze and extract insights',
      runner_type: 'claude',
      config: {
        task_description: 'Analyze the fetched data and extract key insights. Provide a structured summary.',
        system_prompt: 'You are a data analysis expert. Analyze the provided data and return structured insights.'
      },
      order_index: 1
    },
    {
      id: 'step-3',
      name: 'Quality Check',
      description: 'Verify output quality',
      runner_type: 'condition',
      config: { condition: 'success', task_description: 'Check if analysis was successful' },
      order_index: 2
    }
  ]
};

export function OrchestrationClientPage({ initialOrchestrations }: { initialOrchestrations: Orchestration[] }) {
  const [orchestrations, setOrchestrations] = useState<Orchestration[]>(initialOrchestrations);
  const [selected, setSelected] = useState<Orchestration | null>(null);
  const [runState, setRunState] = useState<RunState>({ runId: null, status: 'idle', stepsState: {} });
  const [showBuilder, setShowBuilder] = useState(false);
  type ExecMode = 'sequential' | 'parallel' | 'mixed';
  const [newOrch, setNewOrch] = useState<{ name: string; description: string; execution_mode: ExecMode }>({
    name: '', description: '', execution_mode: 'sequential'
  });
  const [saving, setSaving] = useState(false);

  const handleRun = async (orch: Orchestration) => {
    setSelected(orch);
    setRunState({ runId: null, status: 'running', stepsState: {} });

    try {
      const res = await fetch(`/api/orchestrations/${orch.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} })
      });

      if (!res.ok) {
        const err = await res.json();
        setRunState(prev => ({ ...prev, status: 'failed', error: err.error }));
        return;
      }

      const run = await res.json();
      setRunState({
        runId: run.id,
        status: run.status === 'success' ? 'success' : run.status === 'failed' ? 'failed' : 'running',
        stepsState: run.steps_state ?? {},
        finalOutput: run.final_output,
        error: run.error
      });

      // Update orchestrations list
      setOrchestrations(prev => prev.map(o =>
        o.id === orch.id
          ? { ...o, last_run_at: run.ended_at, last_run_status: run.status, total_runs: (o.total_runs ?? 0) + 1 }
          : o
      ));
    } catch (err) {
      setRunState(prev => ({ ...prev, status: 'failed', error: String(err) }));
    }
  };

  const handleCreateDemo = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/orchestrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEMO_TEMPLATE)
      });
      if (res.ok) {
        const created = await res.json();
        setOrchestrations(prev => [created, ...prev]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustom = async () => {
    if (!newOrch.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/orchestrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOrch, steps: [] })
      });
      if (res.ok) {
        const created = await res.json();
        setOrchestrations(prev => [created, ...prev]);
        setShowBuilder(false);
        setNewOrch({ name: '', description: '', execution_mode: 'sequential' as ExecMode });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper p-4 pb-24 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink font-serif">AI Orchestration</h1>
            <p className="text-ink/60 text-sm mt-1">멀티 에이전트 파이프라인 — 자동화 체이닝</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateDemo}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-line rounded-xl hover:bg-ink/5 text-ink/70 disabled:opacity-50"
            >
              <Zap size={14} />
              데모 생성
            </button>
            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-ink text-white rounded-xl hover:bg-ink/90"
            >
              <Plus size={16} />
              New Pipeline
            </button>
          </div>
        </div>

        {/* Builder Modal */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowBuilder(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-paper rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h2 className="font-bold text-ink text-lg mb-4">New Orchestration Pipeline</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Pipeline Name</label>
                    <input
                      value={newOrch.name}
                      onChange={e => setNewOrch(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Daily Report Pipeline"
                      className="mt-1 w-full border border-line rounded-xl px-3 py-2.5 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Description</label>
                    <textarea
                      value={newOrch.description}
                      onChange={e => setNewOrch(p => ({ ...p, description: e.target.value }))}
                      placeholder="What does this pipeline do?"
                      rows={2}
                      className="mt-1 w-full border border-line rounded-xl px-3 py-2.5 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-ink/20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Execution Mode</label>
                    <select
                      value={newOrch.execution_mode}
                      onChange={e => setNewOrch(p => ({ ...p, execution_mode: e.target.value as ExecMode }))}
                      className="mt-1 w-full border border-line rounded-xl px-3 py-2.5 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-ink/20"
                    >
                      <option value="sequential">Sequential (순차 실행)</option>
                      <option value="parallel">Parallel (병렬 실행)</option>
                      <option value="mixed">Mixed (혼합)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowBuilder(false)}
                      className="flex-1 py-2.5 border border-line rounded-xl text-sm text-ink/70 hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCustom}
                      disabled={saving || !newOrch.name.trim()}
                      className="flex-1 py-2.5 bg-ink text-white rounded-xl text-sm disabled:opacity-50 hover:bg-ink/90"
                    >
                      {saving ? 'Creating...' : 'Create Pipeline'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orchestrations List */}
        {orchestrations.length === 0 ? (
          <div className="text-center py-20 text-ink/40">
            <GitBranch size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">파이프라인이 없습니다</p>
            <p className="text-sm mt-1">&#34;데모 생성&#34; 버튼으로 시작해보세요</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orchestrations.map(orch => (
              <motion.div
                key={orch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-line rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-ink truncate">{orch.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        orch.execution_mode === 'parallel' ? 'bg-blue-100 text-blue-700' :
                        orch.execution_mode === 'mixed' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {orch.execution_mode}
                      </span>
                      {orch.last_run_status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          orch.last_run_status === 'success' ? 'bg-green-100 text-green-700' :
                          orch.last_run_status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {orch.last_run_status}
                        </span>
                      )}
                    </div>
                    {orch.description && (
                      <p className="text-ink/60 text-sm mt-1 line-clamp-1">{orch.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-ink/40">
                      <span>{(orch.steps as OrchestrationStep[])?.length ?? 0} steps</span>
                      <span>{orch.total_runs ?? 0} runs</span>
                      {orch.last_run_at && (
                        <span>Last: {new Date(orch.last_run_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRun(orch)}
                    disabled={runState.status === 'running'}
                    className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 disabled:opacity-50 shrink-0"
                  >
                    {runState.status === 'running' && selected?.id === orch.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    Run
                  </button>
                </div>

                {/* Steps preview */}
                {(orch.steps as OrchestrationStep[])?.length > 0 && (
                  <div className="mt-4 flex items-center gap-1 flex-wrap">
                    {(orch.steps as OrchestrationStep[]).map((step, i) => {
                      const RunnerIcon = RUNNER_ICONS[step.runner_type] ?? Bot;
                      const colorClass = RUNNER_COLORS[step.runner_type] ?? 'bg-gray-100 text-gray-600';
                      const stepRunState = selected?.id === orch.id ? runState.stepsState[step.id] : null;

                      return (
                        <div key={step.id} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight size={12} className="text-ink/20" />}
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colorClass}`}>
                            {stepRunState?.status === 'running' ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : stepRunState?.status === 'success' ? (
                              <CheckCircle size={10} />
                            ) : stepRunState?.status === 'failed' ? (
                              <XCircle size={10} />
                            ) : (
                              <RunnerIcon size={10} />
                            )}
                            {step.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Run result */}
                {selected?.id === orch.id && runState.status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-line"
                  >
                    {runState.status === 'running' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 size={14} className="animate-spin" />
                        Pipeline executing...
                      </div>
                    )}
                    {runState.status === 'success' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                          <CheckCircle size={14} />
                          Pipeline completed successfully
                        </div>
                        {runState.finalOutput != null && (
                          <pre className="text-xs bg-green-50 text-green-900 rounded-xl p-3 overflow-auto max-h-32">
                            {JSON.stringify(runState.finalOutput, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                    {runState.status === 'failed' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                          <XCircle size={14} />
                          Pipeline failed
                        </div>
                        {runState.error && (
                          <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2">{runState.error}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Step Status Detail */}
        {selected && runState.status !== 'idle' && Object.keys(runState.stepsState).length > 0 && (
          <div className="bg-white border border-line rounded-2xl p-5">
            <h3 className="font-bold text-ink mb-4">Step-by-Step Status</h3>
            <div className="space-y-2">
              {(selected.steps as OrchestrationStep[]).map(step => {
                const state = runState.stepsState[step.id];
                const cfg = STEP_STATUS_CONFIG[state?.status as keyof typeof STEP_STATUS_CONFIG] ?? STEP_STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;

                return (
                  <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl bg-ink/2 hover:bg-ink/5 transition-colors">
                    <StatusIcon size={16} className={`mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{step.name}</span>
                        <div className="flex items-center gap-2">
                          {state?.duration_ms && (
                            <span className="text-xs text-ink/40">{state.duration_ms}ms</span>
                          )}
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                      {state?.error && (
                        <p className="text-xs text-red-500 mt-1">{state.error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
