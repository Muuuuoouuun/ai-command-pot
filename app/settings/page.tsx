'use client';

import { SectionTitle } from '@/components/section-title';
import { useState } from 'react';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'warm'>('warm');

  const download = async (format: 'json' | 'csv') => {
    const response = await fetch(`/api/export?format=${format}`);
    if (!response.ok) {
      alert('Export failed. Check server env settings.');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aicn-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <SectionTitle title="Settings" subtitle="Profile, export, integrations" />
      <div className="paper-card space-y-3 p-4 text-sm">
        <p><strong>Profile</strong>: single-user MVP</p>
        <p><strong>Theme</strong>: {theme === 'warm' ? 'Notebook Warm' : 'Notebook Light'}</p>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setTheme('warm')} className={`rounded-full border px-3 py-1 ${theme === 'warm' ? 'bg-ink text-paper' : 'border-line'}`}>Warm</button>
          <button onClick={() => setTheme('light')} className={`rounded-full border px-3 py-1 ${theme === 'light' ? 'bg-ink text-paper' : 'border-line'}`}>Light</button>
        </div>
        <p><strong>Integrations</strong>: set <code>APP_BASE_URL</code>, webhook URL, n8n endpoints in agent config.</p>
      </div>

      <div className="paper-card space-y-3 p-4 text-sm">
        <p className="font-medium">Export Data</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => download('json')} className="rounded-xl bg-ink px-3 py-2 text-paper">Export JSON</button>
          <button onClick={() => download('csv')} className="rounded-xl border border-line px-3 py-2">Export CSV</button>
        </div>
      </div>
    </div>
  );
}
