'use client';

import { useState } from 'react';
import { Play, Pause, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toggleAutomation, triggerAutomation } from '@/app/actions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type Automation = {
    id: string;
    name: string;
    description?: string;
    platform: 'n8n' | 'make';
    trigger_type: string;
    is_active: boolean;
    success_rate: number;
    last_run_at?: string;
    config?: Record<string, any>;
};

export function AutomationCard({ data }: { data: Automation }) {
    const [isActive, setIsActive] = useState(data.is_active);
    const [isToggling, setIsToggling] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [triggerResult, setTriggerResult] = useState<'success' | 'error' | null>(null);

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            await toggleAutomation(data.id, !isActive);
            setIsActive(!isActive);
        } catch {
            alert('Failed to toggle');
        }
        setIsToggling(false);
    };

    const handleTrigger = async () => {
        setTriggering(true);
        setTriggerResult(null);
        try {
            const res = await triggerAutomation(data.id);
            setTriggerResult(res.success ? 'success' : 'error');
        } catch {
            setTriggerResult('error');
        }
        setTriggering(false);
        setTimeout(() => setTriggerResult(null), 3000);
    };

    const hasWebhook = !!(data.config as any)?.webhook_url;

    return (
        <div className={cn("bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden group", isActive ? "border-ink/20 shadow-md" : "border-line opacity-80 filter grayscale-[0.5]")}>
            <div className="flex justify-between items-start mb-4">
                <span className={cn("text-xs uppercase font-bold px-2 py-1 rounded", data.platform === 'n8n' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700")}>
                    {data.platform}
                </span>
                <button
                    onClick={handleToggle}
                    disabled={isToggling}
                    className={cn("w-10 h-6 rounded-full p-1 transition-colors flex items-center shadow-inner", isActive ? "bg-green-500 justify-end" : "bg-gray-300 justify-start")}
                >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
            </div>

            <h3 className="font-serif font-bold text-lg leading-tight mb-1">{data.name}</h3>
            <p className="text-xs text-ink/60 mb-4 line-clamp-2 min-h-[2.5em]">{data.description || 'No description provided'}</p>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-line/50 pt-3 mb-3">
                <div className="flex items-center gap-1.5 text-ink/70">
                    <Clock size={12} />
                    <span>{data.last_run_at ? new Date(data.last_run_at).toLocaleDateString() : 'Never'}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                    <span className={cn("font-medium", data.success_rate >= 95 ? "text-green-600" : "text-yellow-600")}>{data.success_rate}%</span>
                    <span className="text-ink/40">Success</span>
                </div>
            </div>

            {/* Run Now button */}
            {hasWebhook && (
                <button
                    onClick={handleTrigger}
                    disabled={triggering || !isActive}
                    className={cn(
                        "w-full rounded-xl py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-all border",
                        triggerResult === 'success'
                            ? "bg-green-50 border-green-300 text-green-700"
                            : triggerResult === 'error'
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-ink/5 border-transparent hover:bg-ink hover:text-paper text-ink/70 disabled:opacity-40"
                    )}
                >
                    {triggering ? (
                        <><Loader2 size={12} className="animate-spin" /> Triggering...</>
                    ) : triggerResult === 'success' ? (
                        <><CheckCircle2 size={12} /> Triggered</>
                    ) : triggerResult === 'error' ? (
                        <><XCircle size={12} /> Failed</>
                    ) : (
                        <><Play size={12} fill="currentColor" /> Run Now</>
                    )}
                </button>
            )}
        </div>
    );
}
