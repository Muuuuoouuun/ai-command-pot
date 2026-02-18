'use client';

import { useState } from 'react';
import { Save, Loader2, PenLine } from 'lucide-react';
import { createMemo } from '@/app/actions';

export function MemoInput() {
    const [text, setText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!text.trim()) return;
        setIsSaving(true);
        try {
            await createMemo(text);
            setText('');
        } catch (e) {
            alert('Failed to save memo');
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white border border-line rounded-2xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-ink/10 transition-all">
            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Log a system note, observation, or task..."
                    className="w-full h-24 p-4 pr-12 resize-none outline-none text-sm bg-transparent rounded-xl placeholder:text-ink/40"
                />
                <div className="absolute top-3 right-3">
                    <PenLine size={16} className="text-ink/20" />
                </div>
            </div>
            <div className="flex justify-between items-center px-4 pb-3 pt-1">
                <span className="text-xs text-ink/40 italic">
                    {text.length > 0 ? "Ready to log" : "Waiting for input..."}
                </span>
                <button
                    onClick={handleSave}
                    disabled={!text.trim() || isSaving}
                    className="bg-ink text-white rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2 hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Memo
                </button>
            </div>
        </div>
    );
}
