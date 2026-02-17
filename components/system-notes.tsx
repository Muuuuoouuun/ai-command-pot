'use client';

import { useEffect, useState } from 'react';

export function SystemNotes() {
  const [note, setNote] = useState('이번 달 개선점, 키 로테이션 예정 메모를 남겨보세요.');
  const [savedRuns, setSavedRuns] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('aicn-system-note');
    if (saved) setNote(saved);
    const notes = JSON.parse(localStorage.getItem('aicn-result-notes') ?? '[]') as string[];
    setSavedRuns(notes.slice(0, 3));
  }, []);

  return (
    <div className="paper-card p-4">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ink/60">System Notes</p>
      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          localStorage.setItem('aicn-system-note', e.target.value);
        }}
        className="h-24 w-full rounded-xl border border-line bg-white/70 p-3 text-sm"
      />
      {savedRuns.length ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/60">Saved Run Notes</p>
          {savedRuns.map((item, index) => <p key={`${index}-${item.slice(0, 8)}`} className="line-clamp-1 text-xs text-ink/80">• {item}</p>)}
        </div>
      ) : null}
    </div>
  );
}
