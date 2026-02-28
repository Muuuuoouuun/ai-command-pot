'use client';

import { useState, useTransition } from 'react';
import { Trash2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteMemo } from '@/app/actions';
import { useRouter } from 'next/navigation';

type Memo = {
    id: string;
    content: string;
    is_processed: boolean;
    created_at: string;
};

export function MemoTimeline({ memos }: { memos: unknown[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    // Optimistic: track IDs being deleted so they fade immediately
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    const handleDelete = (id: string) => {
        setDeletingIds(prev => new Set(prev).add(id));
        startTransition(async () => {
            try {
                await deleteMemo(id);
                router.refresh();
            } catch {
                // Revert optimistic removal on error
                setDeletingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        });
    };

    const visibleMemos = (memos as Memo[]).filter(m => !deletingIds.has(m.id));

    if (visibleMemos.length === 0) {
        return (
            <div className="text-center py-8 border-2 border-dashed border-line rounded-xl opacity-50">
                <p className="text-sm font-medium">No memos found.</p>
                <p className="text-xs">Start a new log above.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 border-l border-line space-y-8">
            <AnimatePresence initial={false}>
                {visibleMemos.map((memo, index) => (
                    <motion.div
                        key={memo.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="relative"
                    >
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${memo.is_processed ? 'bg-green-500 border-green-100' : 'bg-white border-ink'}`} />

                        <div className="bg-white p-4 rounded-xl border border-line shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-xs text-ink/40">
                                    <Clock size={12} />
                                    {new Date(memo.created_at).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    {memo.is_processed && (
                                        <span className="flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 size={10} /> AI Processed
                                        </span>
                                    )}
                                    {/* Delete button — visible on hover */}
                                    <button
                                        onClick={() => handleDelete(memo.id)}
                                        disabled={isPending}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-ink/30 hover:text-red-500"
                                        title="Delete memo"
                                    >
                                        {deletingIds.has(memo.id)
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Trash2 size={13} />
                                        }
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{memo.content}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
