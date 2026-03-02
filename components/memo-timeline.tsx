'use client';

import { CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Memo = {
    id: string;
    content: string;
    created_at: string;
    is_processed: boolean;
};

// Now accepts memos via props instead of local storage
export function MemoTimeline({ memos }: { memos: Memo[] }) {
    if (memos.length === 0) {
        return (
            <div className="text-center py-8 border-2 border-dashed border-line rounded-xl opacity-50">
                <p className="text-sm font-medium">No memos found.</p>
                <p className="text-xs">Start a new log above.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 border-l border-line space-y-8">
            <AnimatePresence>
                {memos.map((memo, index) => (
                    <motion.div
                        key={memo.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                    >
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${memo.is_processed ? 'bg-green-500 border-green-100' : 'bg-white border-ink'}`} />

                        <div className="bg-white p-4 rounded-xl border border-line shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-xs text-ink/40">
                                    <Clock size={12} />
                                    {new Date(memo.created_at).toLocaleString()}
                                </div>
                                {memo.is_processed && (
                                    <span className="flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 size={10} /> AI Processed
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{memo.content}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
