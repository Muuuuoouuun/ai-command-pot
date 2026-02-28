'use client';

import { DataConnectionBadge } from '@/components/data-connection-badge';
import { SectionTitle } from '@/components/section-title';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [connected, setConnected] = useState(true);
  const [counts, setCounts] = useState({ subscriptions: 0, agents: 0, runs: 0, keys: 0 });

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => {
        setConnected(Boolean(d?.connected));
        setCounts(d?.counts ?? { subscriptions: 0, agents: 0, runs: 0, keys: 0 });
      })
      .catch(() => setConnected(false));
  }, []);

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
      <DataConnectionBadge connected={connected} note="health endpoint check" />

      <div className="paper-card space-y-3 p-4 text-sm">
        <p><strong>Profile</strong>: single-user MVP</p>
        <div className="space-y-2">
          <p className="font-medium">Theme</p>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setTheme('warm')}
              className={`rounded-full border px-4 py-1.5 transition-all ${theme === 'warm' ? 'bg-ink text-paper border-ink' : 'border-line hover:border-ink/40'}`}
            >
              🟤 Notebook Warm
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`rounded-full border px-4 py-1.5 transition-all ${theme === 'light' ? 'bg-ink text-paper border-ink' : 'border-line hover:border-ink/40'}`}
            >
              ⚪ Clean Light
            </button>
          </div>
          <p className="text-xs text-ink/40">Saved automatically — persists across sessions.</p>
        </div>
        <p><strong>Integrations</strong>: set <code>APP_BASE_URL</code>, webhook URL, n8n endpoints in agent config.</p>
      </div>

      <div className="paper-card space-y-2 p-4 text-sm">
        <p className="font-medium">Data Link Snapshot</p>
        <p>Subscriptions: {counts.subscriptions} · Agents: {counts.agents}</p>
        <p>Runs: {counts.runs} · Keys: {counts.keys}</p>
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
