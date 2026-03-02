'use client';

import { useState } from 'react';
import { Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { processAiCommand } from '@/app/actions';

import { motion, AnimatePresence } from 'framer-motion';

export function CommandInterface() {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [response, setResponse] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setIsProcessing(true);
        setResponse(null);
        try {
            const res = await processAiCommand(input);
            setResponse(res.response);
        } catch {
            setResponse("Command failed to execute. Please try again.");
        }
        setIsProcessing(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur-md" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden p-1 flex items-center gap-2 pr-2 ring-1 ring-ink/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-white flex items-center justify-center border border-line shadow-inner shrink-0 ml-1">
                    <Sparkles size={18} className="text-ink/40 animate-pulse" />
                </div>
                <form onSubmit={handleSubmit} className="flex-1 flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Command your AI fleet (e.g., 'Analyze logs from last hour')..."
                        className="w-full bg-transparent border-none outline-none text-lg font-medium placeholder:text-ink/30 h-14"
                        disabled={isProcessing}
                    />
                </form>
                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isProcessing}
                    className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink/80 transition-all disabled:opacity-50 disabled:scale-95 shadow-md"
                >
                    {isProcessing ? <Loader2 size={18} className="animate-spin text-white/50" /> : <Send size={18} className="ml-0.5" />}
                </button>
            </div>

            <AnimatePresence>
                {response && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 mx-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-soft-xl rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-blue-500" />
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <MessageSquare size={14} className="text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wider font-bold text-ink/40 mb-1">AI Response</p>
                                <p className="text-sm text-ink leading-relaxed font-medium whitespace-pre-wrap">{response}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
