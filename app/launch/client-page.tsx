'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Key, CreditCard, Play, ArrowUpRight, X } from 'lucide-react';
import { CommandInterface } from '@/components/command-interface';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createMemo } from '@/app/actions';

type Agent = {
    id: string;
    name: string;
    description?: string;
    category?: string;
    runner_type: string;
    favorite?: boolean;
};
type Subscription = {
    id: string;
    service_name: string;
    renewal_date: string;
    monthly_cost: number;
    billing_cycle: string;
};

type VaultKey = {
    id: string;
    is_active: boolean;
    provider: string;
    last4: string;
    label?: string;
};

export default function LaunchClientPage({
    agents,
    subscriptions,
    keys
}: {
    agents: Agent[],
    subscriptions: Subscription[],
    keys: VaultKey[]
}) {
    const [selected, setSelected] = useState<Agent | null>(null);
    const [jsonInput, setJsonInput] = useState('{}');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [running, setRunning] = useState(false);
    const [inputError, setInputError] = useState('');

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
        } catch {
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
                            <Link href="#" className="border-2 border-dashed border-line rounded-2xl p-5 flex flex-col items-center justify-center text-ink/40 hover:text-ink hover:bg-white/50 transition-colors bg-transparent">
                                <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center mb-2">
                                    <ArrowUpRight size={18} />
                                </div>
                                <span className="font-medium text-sm">Deploy New Agent</span>
                            </Link>
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
                                            <div className="text-xs text-ink/40 font-mono">•••• {key.last4}</div>
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

            {/* Run Modal */}
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
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
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
