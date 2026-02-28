'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Key, CreditCard, Play, Plus, X, Loader2 } from 'lucide-react';
import { CommandInterface } from '@/components/command-interface';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createMemo, createAgent } from '@/app/actions';
import Link from 'next/link';

type Agent = {
    id: string;
    name: string;
    description?: string;
    category?: string;
    runner_type: string;
    favorite?: boolean;
};

const RUNNER_TYPES = [
    { value: 'webhook', label: 'Webhook', hint: 'POST to an external URL' },
    { value: 'llm_call', label: 'LLM Call', hint: 'Call an AI model (OpenAI / Anthropic)' },
];

const LLM_PROVIDERS = [
    { value: 'openai', label: 'OpenAI (GPT)' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
];

function CreateAgentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [runnerType, setRunnerType] = useState('webhook');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [llmProvider, setLlmProvider] = useState('anthropic');
    const [llmModel, setLlmModel] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const buildConfig = () => {
        if (runnerType === 'webhook') {
            return JSON.stringify({ webhook_url: webhookUrl });
        }
        if (runnerType === 'llm_call') {
            const cfg: Record<string, string> = { provider: llmProvider };
            if (llmModel) cfg.model = llmModel;
            if (systemPrompt) cfg.system_prompt = systemPrompt;
            return JSON.stringify(cfg);
        }
        return '{}';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('Agent name is required.'); return; }
        if (runnerType === 'webhook' && !webhookUrl.trim()) { setError('Webhook URL is required.'); return; }
        setError('');
        setSaving(true);
        try {
            await createAgent({ name, description, category, runner_type: runnerType, config: buildConfig() });
            onCreated();
        } catch (err: any) {
            setError(err.message ?? 'Failed to create agent.');
        }
        setSaving(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center text-ink"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-line bg-paper shadow-2xl overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-line/50 bg-white/50">
                    <h3 className="font-serif text-xl font-bold">Deploy New Agent</h3>
                    <button onClick={onClose} className="p-1 hover:bg-ink/5 rounded-full"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Agent Name *</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Daily Report Fetcher"
                            className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm focus:ring-1 focus:ring-ink outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Description</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this agent do?"
                            className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm focus:ring-1 focus:ring-ink outline-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Category</label>
                        <input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. data, analysis, notification"
                            className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm focus:ring-1 focus:ring-ink outline-none"
                        />
                    </div>

                    {/* Runner Type */}
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Runner Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {RUNNER_TYPES.map((rt) => (
                                <button
                                    key={rt.value}
                                    type="button"
                                    onClick={() => setRunnerType(rt.value)}
                                    className={`rounded-xl border p-3 text-left transition-all ${runnerType === rt.value ? 'border-ink bg-ink text-white' : 'border-line bg-white/70 hover:border-ink/40'}`}
                                >
                                    <div className="font-medium text-sm">{rt.label}</div>
                                    <div className={`text-xs mt-0.5 ${runnerType === rt.value ? 'text-white/60' : 'text-ink/40'}`}>{rt.hint}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Webhook config */}
                    {runnerType === 'webhook' && (
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Webhook URL *</label>
                            <input
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://your-n8n.com/webhook/..."
                                className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm font-mono focus:ring-1 focus:ring-ink outline-none"
                            />
                        </div>
                    )}

                    {/* LLM config */}
                    {runnerType === 'llm_call' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Provider</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {LLM_PROVIDERS.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setLlmProvider(p.value)}
                                            className={`rounded-xl border p-2.5 text-sm transition-all ${llmProvider === p.value ? 'border-ink bg-ink text-white' : 'border-line bg-white/70 hover:border-ink/40'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">Model (optional)</label>
                                <input
                                    value={llmModel}
                                    onChange={(e) => setLlmModel(e.target.value)}
                                    placeholder={llmProvider === 'anthropic' ? 'claude-3-5-haiku-20241022' : 'gpt-4o-mini'}
                                    className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm font-mono focus:ring-1 focus:ring-ink outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5 font-medium">System Prompt (optional)</label>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="You are a helpful assistant..."
                                    rows={3}
                                    className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm focus:ring-1 focus:ring-ink outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-xs text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-600 rounded-full" /> {error}</p>}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-xl bg-ink py-3 text-paper font-medium hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <><Loader2 size={16} className="animate-spin" /> Deploying...</> : <><Plus size={16} /> Deploy Agent</>}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default function LaunchClientPage({
    agents,
    subscriptions,
    keys
}: {
    agents: Agent[],
    subscriptions: any[],
    keys: any[]
}) {
    const router = useRouter();
    const [selected, setSelected] = useState<Agent | null>(null);
    const [jsonInput, setJsonInput] = useState('{}');
    const [result, setResult] = useState<any>(null);
    const [running, setRunning] = useState(false);
    const [inputError, setInputError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

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
        try {
            const response = await fetch(`/api/agents/${selected.id}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: parsedInput })
            });
            setResult(await response.json());
        } catch (e) {
            setResult({ error: 'Failed to run agent' });
        }
        setRunning(false);
    };

    const saveAsNote = async () => {
        const content = `[${new Date().toLocaleString()}] ${selected?.name} Result:\n${JSON.stringify(result?.output ?? result, null, 2)}`;
        try {
            await createMemo(content);
            alert('Saved to System Memos.');
        } catch {
            alert('Failed to save memo.');
        }
    };

    return (
        <div className="space-y-12">
            <div className="text-center space-y-6 py-8">
                <h1 className="text-4xl font-serif font-bold text-ink">AI Control Center</h1>
                <p className="text-ink/60 max-w-md mx-auto">Directly command your AI fleet or manage your infrastructure.</p>
                <CommandInterface />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Active Agents (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
                                <Bot className="text-ink/40" /> Active Agents
                            </h2>
                            <span className="bg-ink/5 text-ink/60 text-xs px-2 py-0.5 rounded-full">{agents.length} Ready</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="group bg-white border border-line rounded-2xl p-5 hover:shadow-md transition-all relative overflow-hidden cursor-pointer"
                                    onClick={() => { setSelected(agent); setResult(null); setJsonInput('{}'); }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="bg-ink text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:bg-ink/80 transition-colors">
                                            Run <Play size={10} fill="currentColor" />
                                        </button>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3">
                                        <Bot size={20} className="text-ink/60" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{agent.name}</h3>
                                    <p className="text-sm text-ink/60 line-clamp-2">{agent.description || 'System agent ready for deployment.'}</p>
                                </div>
                            ))}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="border-2 border-dashed border-line rounded-2xl p-5 flex flex-col items-center justify-center text-ink/40 hover:text-ink hover:bg-white/50 transition-colors bg-transparent"
                            >
                                <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center mb-2">
                                    <Plus size={18} />
                                </div>
                                <span className="font-medium text-sm">Deploy New Agent</span>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right Column: Infrastructure (4 cols) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Subscriptions */}
                    <section>
                        <h2 className="flex items-center gap-2 font-serif text-lg font-bold mb-4">
                            <CreditCard size={18} className="text-ink/40" /> Subscriptions
                        </h2>
                        <div className="bg-white border border-line rounded-2xl overflow-hidden divide-y divide-line/50">
                            {subscriptions.slice(0, 5).map(sub => (
                                <div key={sub.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="font-medium text-sm">{sub.service_name}</div>
                                        <div className="text-xs text-ink/40">Renews {formatDate(sub.renewal_date)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-sm">{formatCurrency(Number(sub.monthly_cost))}</div>
                                        <div className="text-[10px] text-ink/40">{sub.billing_cycle}</div>
                                    </div>
                                </div>
                            ))}
                            <Link href="/subscriptions" className="block text-center py-3 text-xs font-medium text-ink/40 hover:text-ink hover:bg-gray-50 transition-colors">
                                Manage All Subscriptions
                            </Link>
                        </div>
                    </section>

                    {/* API Keys */}
                    <section>
                        <h2 className="flex items-center gap-2 font-serif text-lg font-bold mb-4">
                            <Key size={18} className="text-ink/40" /> API Vault
                        </h2>
                        <div className="space-y-3">
                            {keys.slice(0, 3).map(key => (
                                <div key={key.id} className="bg-white border border-line rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-red-300'}`} />
                                        <div>
                                            <div className="font-medium text-sm">{key.provider}</div>
                                            <div className="text-xs text-ink/40 font-mono">&bull;&bull;&bull;&bull; {key.last4}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] bg-gray-100 px-2 py-1 rounded text-ink/60">
                                        {key.label || 'Key'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Create Agent Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateAgentModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => { setShowCreateModal(false); router.refresh(); }}
                    />
                )}
            </AnimatePresence>

            {/* Run Agent Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center text-ink"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg rounded-2xl border border-line bg-paper shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-line/50 bg-white/50">
                                <h3 className="font-serif text-xl font-bold">{selected.name}</h3>
                                <button onClick={() => setSelected(null)} className="p-1 hover:bg-ink/5 rounded-full"><X size={18} /></button>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2 font-medium">Input Parameters (JSON)</label>
                                    <textarea
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                        className="h-32 w-full rounded-xl border border-line bg-white/70 p-3 text-sm font-mono focus:ring-1 focus:ring-ink"
                                    />
                                    {inputError && <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-600 rounded-full" /> {inputError}</p>}
                                </div>

                                <button
                                    onClick={runAgent}
                                    disabled={running}
                                    className="w-full rounded-xl bg-ink py-3 text-paper font-medium hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
                                >
                                    {running ? 'Executing Algorithm...' : <><Play size={16} fill="currentColor" /> Execute Agent</>}
                                </button>

                                <AnimatePresence>
                                    {result && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                                            <div className="mt-2 space-y-2 pt-4 border-t border-line/50">
                                                <label className="block text-xs uppercase tracking-wider text-ink/60 font-medium">Execution Result</label>
                                                <pre className="max-h-48 overflow-auto rounded-xl border border-line bg-white/90 p-3 text-xs font-mono">{JSON.stringify(result.output ?? result, null, 2)}</pre>
                                                <button onClick={saveAsNote} className="w-full rounded-xl border border-line bg-white hover:bg-gray-50 py-2 text-xs font-medium transition-colors">
                                                    Save Result to System Memos
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
